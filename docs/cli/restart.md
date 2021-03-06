restart
=======

Restarts your app.

[Stops](./stop.md) and then [starts](./start.md) an app. If you wish to rerun your build steps or you've altered your Landofile you should check out [rebuild](./rebuild.md).

> #### Warning::This command no longer invokes any build steps.
>
> As of version `3.0.0-rc1` Lando will no longer run **ANY** build steps on a `lando restart`.

Usage
-----

```bash
lando restart
```

Options
-------

```bash
--clear        Clears the lando tasks cache
--lando        Show help for lando-based options
--verbose, -v  Runs with extra verbosity
--version      Show version number
```
