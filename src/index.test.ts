import * as fs from "fs"
import { mockCspellJSON } from "./cspell.mock"
import { gitSpellcheck } from "./index"

declare const global: any

jest.mock("fs")

describe("gitSpellcheck()", () => {
  let modifiedFile
  let createdFile
  let mockModifiedFileDiff
  let mockCreatedFileDiff
  let expectedWarning
  let expectedMarkdown

  let gitDiffForFileMock: jest.Mock<any>
  let fsReadFileSyncMock: jest.Mock<any>

  const expectFsReadFileSyncMock = () => {
    expect(fsReadFileSyncMock).toHaveBeenCalledWith("cspell.json", "utf-8")
  }

  const expectGitDiffForFile = () => {
    expect(gitDiffForFileMock).toHaveBeenCalledTimes(2)
    expect(gitDiffForFileMock).toHaveBeenCalledWith(modifiedFile)
    expect(gitDiffForFileMock).toHaveBeenCalledWith(createdFile)
  }

  const expectWarn = () => {
    expect(global.warn).toHaveBeenCalledTimes(1)
    expect(global.warn).toHaveBeenCalledWith(expectedWarning)
  }

  const expectMarkdown = () => {
    expect(global.markdown).toHaveBeenCalledTimes(1)
    expect(global.markdown).toHaveBeenCalledWith(expectedMarkdown)
  }

  beforeEach(() => {
    modifiedFile = "modified.ts"
    createdFile = "created.ts"
    mockModifiedFileDiff = {
      after: "Correct\nCorrect\nCorrect Incorrect\nIncorrect",
      added: "+Incorrect",
    }
    mockCreatedFileDiff = {
      after: "Correct\nCorrect\nCorrect Incorrect\nIncorrect",
      added: "+Correct\n+Correct\n+Correct Incorrect\n+Incorrect",
    }
    expectedWarning = ":eyes: There seems to be some typos"
    expectedMarkdown = `Typos in modified.ts

| Position (Line:Col) | Word |
| --- | --- |
| 4:0 | Incorrect |

Typos in created.ts

| Position (Line:Col) | Word |
| --- | --- |
| 3:8 | Incorrect |
| 4:0 | Incorrect |`

    gitDiffForFileMock = jest.fn().mockImplementation(file => {
      switch (file) {
        case modifiedFile:
          return mockModifiedFileDiff
        case createdFile:
          return mockCreatedFileDiff
      }
    })

    global.warn = jest.fn()
    global.message = jest.fn()
    global.fail = jest.fn()
    global.markdown = jest.fn()
    global.danger = {
      git: {
        modified_files: [modifiedFile],
        created_files: [createdFile],
        diffForFile: gitDiffForFileMock,
      },
    }
    fsReadFileSyncMock = jest.spyOn(fs, "readFileSync").mockReturnValue(mockCspellJSON)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("Warns when there are typos", async () => {
    await gitSpellcheck()

    expectFsReadFileSyncMock()
    expectGitDiffForFile()
    expectWarn()
    expectMarkdown()
  })

  it("Does not warn when there are no typos", async () => {
    mockModifiedFileDiff.after = "Correct\nCorrect\nCorrect Incorrect\nCorrect"
    mockModifiedFileDiff.added = "+Correct"
    mockCreatedFileDiff.after = "Correct"
    mockCreatedFileDiff.added = "+Correct"

    await gitSpellcheck()

    expectFsReadFileSyncMock()
    expectGitDiffForFile()
    expect(global.warn).not.toBeCalled()
    expect(global.markdown).not.toBeCalled()
  })
})
