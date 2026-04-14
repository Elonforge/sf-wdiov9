import type { Options, Capabilities } from '@wdio/types';
import { config as baseConfig } from './wdio.base.conf';

/**
 * Chrome-specific configuration.
 * Spreads on top of the base config and forces headless Chrome.
 */
export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  ...baseConfig,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: [
          '--headless',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080',
        ],
      },
    },
  ],
  maxInstances: 5,
};
