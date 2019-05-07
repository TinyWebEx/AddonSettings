# TinyWebEx AddonSettings

A tiny library that helps you to retrieve the settings of your add-on.

## Features

* allows you to specify default settings and automatically returns these when you request a setting
* requests the [managed options](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/storage/managed) first, so administrators can override user's settings with managed ones
* falls back to sync storage
* removes some awkwardness of the add-on storage API, i.e. e.g. returns you single results directly than wrapped in an object
* caches the options by default

## Usage

### Getting settings

The `.get` API is the most important one, as it returns the setting you requested.

```js
AddonSettings.get("thisExampleSettingEnabled").then((exampleSettingEnabled) => {
    if (exampleSettingEnabled) {
        // do something...
    }
}
```

As the usual storage API, it does support `null` or no first parameter to return all options of the WebExtension. However, note that it does not yet support the method of passing an array of strings or object to return multiple values at the same time.

It tries to use the `sync` storage method and falls back to a [default option](#default-values), if specified. Also, if there is a managed setting (`managed` storage) it takes precedence.

### Saving settings

Respectively you can use `.set` to save an option (in the sync storage). It is useful to use this, as it also updates the value in the internal cache of the module.
Again, it simplifies the API, so you do not have to wrap a single option in one object, but of course you can still use an object, if you want.

For example these calls are equivalent:
```js
AddonSettings.set("thisExampleSettingEnabled", false);
// does the same as
AddonSettings.set({
    thisExampleSettingEnabled: false
});
```

### Caching

As already mentioned above, the addon by default caches the options and that may be cumbersome when settings are changed by other parts of your add-on or so. Thus, you also have the ability to disable caching completly. Just call `AddonSettings.setCaching(false)`.

Alternatively, you can also manually reload the options if you run `.loadOptions()` again. Obviously, this only makles sense if you have caching enabled.

### Default values

It's a common use-case to be able to define default values for your settings. You could save them at the first installation of your add-on, but then you cannot differenciate between a default option that the user did not set/explicitly modify and a setting, where the user explicitly set the default value. This may be handy if you later e.g. change the default value of an option.

To accommodate for this use case, this module integrates a final fallback for getting such a default option. 

#### Setup default value store

Obviously, you need to save the default options somewhere in your add-on. As with the other TinyWebEx modules, this is done in a dir called `data` in the parent directory of this module.

So this is the required directory structure:
```
.
├── AddonSettings
│   ├── AddonSettings.js
│   ├── CONTRIBUTORS
│   ├── LICENSE.md
│   └── README.md
├── data
│   ├── ...
│   └── DefaultSettings.js
...
```

Due to the static ES6 module loading, this path is fixed and unfortunately cannot be modified.
The file `DefaultSettings.js` is an ES6 module and has to [export](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/export) a variable named `DEFAULT_SETTINGS` with an object of the default settings.
It is recommended that this variable is a [constant](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/const) and that the object are [frozen](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze). Remember, also to freeze the objects inside of the objects. See the example on how to do that.

A template for that file can be found in [`examples/DefaultSettings.js`](examples/DefaultSettings.js).

There are also unit tests in the file [`tests/dataTest/defaultSettings.test.js`](tests/dataTest/defaultSettings.test.js) that may help you to test this constant.

**Important:** Even if you do not want to use that feature, the file including the export has to exist.  
**Attention:** When introducing a new setting, you should also always specify a default value – even if it is just an empty string. Otherwise, the addon will log an error and throw an exception.

This is how it looks like, when you forgot to define a default option for a setting:
```
> await AddonSettings.get("unknownOption")
Default value for option "unknownOption" missing. No default value defined. AddonSettings.js:41:9
Error: Default value for option "unknownOption" missing. No default value defined. AddonSettings.js:42:15 
```

This helps you to find typing errors or missing options etc.
