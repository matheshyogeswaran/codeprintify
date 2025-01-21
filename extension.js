const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let helloWorldCommand = vscode.commands.registerCommand('codeprintify.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from CodePrintify!');
  });

  let copyFolderStructureCommand = vscode.commands.registerCommand('extension.copyFolderStructure', () => {
    const folderUri = vscode.workspace.workspaceFolders?.[0].uri;
    if (folderUri) {
      const filePath = path.join(folderUri.fsPath, 'folder_structure.txt');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(getFolderStructure(folderUri.fsPath));
      writeStream.end(() => {
        vscode.window.showInformationMessage(`Folder structure saved to ${filePath}`);
        vscode.workspace.openTextDocument(filePath).then(doc => vscode.window.showTextDocument(doc));
      });
    } else {
      vscode.window.showErrorMessage('No workspace folder found.');
    }
  });

  let copyCodeFilesCommand = vscode.commands.registerCommand('extension.copyCodeFiles', () => {
    const folderUri = vscode.workspace.workspaceFolders?.[0].uri;
    if (folderUri) {
      const filePath = path.join(folderUri.fsPath, 'code_files.txt');
      const writeStream = fs.createWriteStream(filePath);
      getCodeFiles(folderUri.fsPath, writeStream).then(() => {
        writeStream.end(() => {
          vscode.window.showInformationMessage(`Code files saved to ${filePath}`);
          vscode.workspace.openTextDocument(filePath).then(doc => vscode.window.showTextDocument(doc));
        });
      });
    } else {
      vscode.window.showErrorMessage('No workspace folder found.');
    }
  });

  context.subscriptions.push(helloWorldCommand, copyFolderStructureCommand, copyCodeFilesCommand);
}

function deactivate() {}

// Exclude these folders and files
const excludeList = [
  'node_modules',
  '.git',
  '.vscode',
  'dist',
  'build',
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'folder_structure.txt', // Exclude generated folder structure file
  'code_files.txt'        // Exclude generated code files
];

// Function to get folder structure recursively while excluding unwanted items
function getFolderStructure(dir, indent = '') {
  let result = '';
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (excludeList.includes(file)) return; // Skip excluded items

    if (fs.statSync(fullPath).isDirectory()) {
      result += `${indent}${file}/\n`;
      result += getFolderStructure(fullPath, indent + '  ');
    } else {
      result += `${indent}${file}\n`;
    }
  });
  return result;
}

// Function to get code files and write content incrementally to avoid memory issues
async function getCodeFiles(dir, writeStream) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (excludeList.includes(file)) continue; // Skip excluded items

    if (fs.statSync(fullPath).isDirectory()) {
      await getCodeFiles(fullPath, writeStream);
    } else {
      writeStream.write(`--- ${fullPath} ---\n`);
      const readStream = fs.createReadStream(fullPath, 'utf-8');
      await new Promise((resolve) => {
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', resolve);
      });
      writeStream.write('\n\n');
    }
  }
}

module.exports = {
  activate,
  deactivate
};
