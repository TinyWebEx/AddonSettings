# TinyWE AddonSettings

A tiny library that helps you to retrieve the settings of your add-on.

## Features

* allows you to specify default settings and automatically returns these when you request a setting
* requests the managed option first, so administrators can override user's settings with managed ones
* falls back to sync storage
* removes some awkwardness of the add-on storage API, i.e. e.g. returns you single results directly than wrapped in an object
* caches the options by default

## Usage

The `.get` APi is the most important one, as it returns the setting you requested.

```js
AddonSettings.get("thisExampleSettingEnabled").then((exampleSettingEnabled) => {
    if (exampleSettingEnabled) {
        // do something...
    }
}
```

You can use ....
