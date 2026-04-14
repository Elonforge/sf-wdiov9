import type { Options, Capabilities } from '@wdio/types';
import { config as baseConfig } from './wdio.base.conf';

/**
 * Firefox-specific configuration.
 * Spreads on top of the base config and forces headless Firefox.
 */
export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  ...baseConfig,
  capabilities: [
    {
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: ['-headless'],
      },
    },
  ],
  maxInstances: 5,
};
