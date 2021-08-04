// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function message(message: string): void
export declare function warn(message: string): void
export declare function fail(message: string): void
export declare function markdown(message: string): void

import * as cspell from "cspell-lib"
import { extname } from "path"

interface FileTypo {
  file: string
  infoItems: cspell.TextInfoItem[]
}

async function checkFile(file: string): Promise<FileTypo> {
  const diff = await danger.git.diffForFile(file)
  if (!diff) {
    return { file, infoItems: [] }
  }
  const source = diff.after

  const ext = extname(file)
  const languageIds = cspell.getLanguagesForExt(ext)
  const mergedSettings = cspell.mergeSettings(cspell.getDefaultSettings(), {
    source: { name: file, filename: file },
  })
  const config = cspell.constructSettingsForText(mergedSettings, source, languageIds)

  return {
    file,
    infoItems: await cspell.checkText(source, config).then(info => {
      return info.items.filter(i => i.isError)
    }),
  }
}

function describeTypo(typo: FileTypo): string {
  return (
    `Typos in ${typo.file}\n|Position|Word|\n|-|-|\n` +
    typo.infoItems.map(infoItem => `|${infoItem.startPos}|${infoItem.text}|`).join("\n")
  )
}

/**
 * This plugin checks the spelling in code and reports any error as markdown PR comment.
 */
export async function gitSpellcheck() {
  const files = [...danger.git.modified_files, ...danger.git.created_files]
  const typos = await Promise.all(files.map(checkFile))
  const nonemptyTypos = typos.filter(typo => typo.infoItems.length > 0)
  if (nonemptyTypos.length > 0) {
    const typoDescription = nonemptyTypos.map(describeTypo).join("\n")

    warn("😡 There seems to be some typos")
    markdown(typoDescription)
  }
}
