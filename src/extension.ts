import * as vscode from 'vscode';
import * as path from 'path';
import {
    registerDefinitionProvider,
    registerDocumentLinkProvider,
    registerReferenceProvider,
    registerCodeLensProvider,
    registerDocumentSymbolProvider,
    registerFormattingProvider
} from './providers';

export function activate(context: vscode.ExtensionContext) {
    console.log('FRG extension is now active!');

    // Register all language providers
    context.subscriptions.push(registerDefinitionProvider());
    context.subscriptions.push(registerDocumentLinkProvider());
    context.subscriptions.push(registerReferenceProvider());
    context.subscriptions.push(registerCodeLensProvider());
    context.subscriptions.push(registerDocumentSymbolProvider());
    context.subscriptions.push(registerFormattingProvider());
}

export function deactivate() {}
