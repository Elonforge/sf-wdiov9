/**
 * Global type augmentations for WebdriverIO v9.
 *
 * Importing from `webdriverio` here triggers the module-augmentation inside
 * `webdriverio/build/@types/async.d.ts`, which adds all browser commands
 * (url, getTitle, saveScreenshot, …) to the `WebdriverIO.Browser` interface.
 */
import 'webdriverio';
