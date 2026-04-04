import * as vscode from 'vscode';
import { AuthManager } from './auth';
import { GlmAuthManager } from './glmAuth';
import { GlmChatProvider } from './glmProvider';
import { NvidiaAuthManager } from './nvidiaAuth';
import { NvidiaChatProvider } from './nvidiaProvider';
import { MiMoChatProvider } from './provider';
import { MiMoApiClient } from './api';
import { GlmApiClient } from './glmApi';
import { NvidiaNimApiClient } from './nvidiaApi';
import { GenericApiClient } from './baseApi';
import type { BaseAuthManager } from './baseAuth';

const PROVIDER_VENDORS = {
  xiaomi: 'crsx.xiaomi',
  glm: 'crsx.glm',
  nvidia: 'crsx.nvidia',
} as const;

async function testConnection(
  authManager: BaseAuthManager,
  clientFactory: (key: string) => GenericApiClient,
  modelId: string,
  providerDisplayName: string,
): Promise<void> {
  const key = await authManager.getApiKey();
  if (!key) {
    const shouldSetKey = await vscode.window.showInformationMessage(
      `${providerDisplayName} API key is not set. Would you like to set it now?`,
      'Set API Key',
    );
    if (shouldSetKey === 'Set API Key') {
      await authManager.promptForApiKey();
    }
    return;
  }

  const client = clientFactory(key);
  try {
    await client.chat(modelId, [{ role: 'user', content: 'Ping' }], {
      maxTokens: 1,
    });
    vscode.window.showInformationMessage(`${providerDisplayName} provider test succeeded.`);
  } catch (error) {
    let message = `${providerDisplayName} test failed: ${String(error)}`;
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
      message = 'Invalid API key. Please set a new key.';
    } else if (error instanceof Error) {
      message = `${providerDisplayName} test failed: ${error.message}`;
    }
    vscode.window.showErrorMessage(message);
  }
}

function registerProviderSafely(
  context: vscode.ExtensionContext,
  providerId: string,
  displayName: string,
  provider: vscode.LanguageModelChatProvider,
): void {
  try {
    context.subscriptions.push(vscode.lm.registerLanguageModelChatProvider(providerId, provider));
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error(`Failed to register ${displayName} provider (${providerId}): ${details}`);
    void vscode.window.showWarningMessage(
      `Extra Chat Providers: ${displayName} is unavailable (${details}).`,
    );
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const xiaomiAuthManager = new AuthManager(context.secrets);
  const xiaomiProvider = new MiMoChatProvider(xiaomiAuthManager);
  const glmAuthManager = new GlmAuthManager(context.secrets);
  const glmProvider = new GlmChatProvider(glmAuthManager);
  const nvidiaAuthManager = new NvidiaAuthManager(context.secrets);
  const nvidiaProvider = new NvidiaChatProvider(nvidiaAuthManager);

  const xiaomiManageActions: Record<string, () => Promise<void>> = {
    'Set API Key': () => xiaomiAuthManager.promptForApiKey().then(() => { }),
    'Clear API Key': () => xiaomiAuthManager.deleteApiKey().then(() => { vscode.window.showInformationMessage('Xiaomi API key cleared'); }),
    'Test Connection': () => testConnection(xiaomiAuthManager, (key) => new MiMoApiClient(key), 'mimo-v2-flash', 'Xiaomi'),
  };

  const glmManageActions: Record<string, () => Promise<void>> = {
    'Set API Key': () => glmAuthManager.promptForApiKey().then(() => { }),
    'Clear API Key': () => glmAuthManager.deleteApiKey().then(() => { vscode.window.showInformationMessage('Z.ai API key cleared'); }),
    'Test Connection': () => testConnection(glmAuthManager, (key) => new GlmApiClient(key), 'glm-4.7-flash', 'Z.ai'),
  };

  const nvidiaManageActions: Record<string, () => Promise<void>> = {
    'Set API Key': () => nvidiaAuthManager.promptForApiKey().then(() => { }),
    'Clear API Key': () => nvidiaAuthManager.deleteApiKey().then(() => { vscode.window.showInformationMessage('NVIDIA NIM API key cleared'); }),
    'Test Connection': () => testConnection(nvidiaAuthManager, (key) => new NvidiaNimApiClient(key), 'google/gemma-4-31b-it', 'NVIDIA NIM'),
  };

  registerProviderSafely(context, PROVIDER_VENDORS.xiaomi, 'Xiaomi', xiaomiProvider);
  registerProviderSafely(context, PROVIDER_VENDORS.glm, 'Z.ai', glmProvider);
  registerProviderSafely(context, PROVIDER_VENDORS.nvidia, 'NVIDIA NIM', nvidiaProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('extra-chat-providers.xiaomi.manage', async () => {
      const choice = await vscode.window.showQuickPick(Object.keys(xiaomiManageActions), {
        placeHolder: 'Manage Xiaomi MiMo provider',
      });
      if (choice) { await xiaomiManageActions[choice](); }
    }),
    vscode.commands.registerCommand('extra-chat-providers.glm.manage', async () => {
      const choice = await vscode.window.showQuickPick(Object.keys(glmManageActions), {
        placeHolder: 'Manage Z.ai (GLM) provider',
      });
      if (choice) { await glmManageActions[choice](); }
    }),
    vscode.commands.registerCommand('extra-chat-providers.nvidia.manage', async () => {
      const choice = await vscode.window.showQuickPick(Object.keys(nvidiaManageActions), {
        placeHolder: 'Manage NVIDIA NIM provider',
      });
      if (choice) { await nvidiaManageActions[choice](); }
    }),
  );
}

export function deactivate(): void { }
