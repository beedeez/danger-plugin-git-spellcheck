// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function message(message: string): void
export declare function warn(message: string): void
export declare function fail(message: string): void
export declare function markdown(message: string): void

import * as cspell from "cspell-lib"
import { readFileSync } from "fs"
import * as micromatch from "micromatch"
import { extname } from "path"
interface Typo {
  line: number
  col: number
  text: string
}

interface FileInfo {
  file: string
  typos: Typo[]
}

const settingsFile = "cspell.json"

async function getSettings(): Promise<cspell.CSpellSettings> {
  try {
    const fileContent = readFileSync(settingsFile, "utf-8")
    const fileSettings = JSON.parse(fileContent) as cspell.FileSettings
    return cspell.mergeSettings(cspell.getDefaultSettings(), fileSettings)
  } catch {
    return cspell.getDefaultSettings()
  }
}

async function checkFile(file: string, settings: cspell.FileSettings): Promise<FileInfo> {
  const diff = await danger.git.diffForFile(file)
  if (!diff) {
    return { file, typos: [] }
  }
  const sourceLines = diff.after.split("\n")
  const addedLines = diff.added.split("\n").map(line => line.substring(1))

  const ext = extname(file)
  const languageIds = cspell.getLanguagesForExt(ext)
  const mergedSettings = cspell.mergeSettings(settings, {
    source: { name: file, filename: file },
  })
  const lineTypos = await Promise.all(
    addedLines.map(async line => {
      const lineSettings = cspell.constructSettingsForText(mergedSettings, line, languageIds)
      const info = await cspell.checkText(line, lineSettings)
      const items = info.items.filter(item => item.isError)
      return items.map(
        item =>
          ({
            line: sourceLines.indexOf(line) + 1,
            col: item.startPos,
            text: item.text,
          } as Typo)
      )
    })
  )
  const typos = lineTypos.flat()
  return { file, typos }
}

function describeInfo(info: FileInfo): string {
  return (
    `Typos in ${info.file}\n\n| Position (Line:Col) | Word |\n| --- | --- |\n` +
    info.typos.map(typo => `| ${typo.line}:${typo.col} | ${typo.text} |`).join("\n")
  )
}

interface Params {
  patterns?: string | ReadonlyArray<string>
  ignore?: string | ReadonlyArray<string>
}

/**
 * This plugin checks the spelling in code and reports any error as markdown PR comment.
 */
export async function gitSpellcheck({ patterns = [], ignore = [] }: Params = {}) {
  const settings = await getSettings()

  const files = [...danger.git.modified_files, ...danger.git.created_files]

  let filteredFiles

  if (ignore.length) {
    filteredFiles = micromatch.not(files, ignore)
  }

  if (patterns.length) {
    filteredFiles = micromatch(filteredFiles || files, patterns)
  }

  const fileInfos = await Promise.all((filteredFiles || files).map(file => checkFile(file, settings)))

  const fileInfosWithTypo = fileInfos.filter(info => info.typos.length > 0)

  if (fileInfosWithTypo.length > 0) {
    const typoDescription = fileInfosWithTypo.map(describeInfo).join("\n\n")

    warn(":eyes: There seems to be some typos")
    markdown(typoDescription)
  }
}
