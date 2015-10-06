Introduction
============

*Roto Game* is a puzzle game inspired by 70s bathroom tiles.

Play at: [rotogame.appspot.com][1] (see also related [Chrome Experiment][2])

There is a variant of Roto Game with squared tiles, [ROTOGAMEsq][3]. Source
code is available on [GitHub][4].


Development
===========

Getting started
---------------

  * To enable debug mode, edit `/main.py`:

        debug = True

    Debug mode should be disabled before deploying the application.

  * For initializing the database, browse the following URL path, relative to
    the root URL of the project. This functionality is only available in debug
    mode. Beware: This may delete existing data, e.g. entries in the top
    players lists.

        /admin/update


Conventions
-----------

  * Coordinates in *piece space* are measured in piece positions on the board.
    The left most piece position is 0, the second left mose is 1, etc..

  * Coordinates and dimensions in piece space are usually postfixed by the
    letter `p` (upper or lower case).


Deployment
----------

  * Follow the instructions below to create a so called custom Dojo build,
    located in:

        /javascript/dojotoolkit

    One reason for using a custom build is that there is a [bug][5] which
    affects FF3, which Felix experienced in 2009 when connected via T-Mobile
    Germany UMTS.

    In a nutshell, it seems that Dojo requires to be evaluated before some
    initialization is finished. For example, Felix saw FF3 requesting the
    following invalid resource:

        http://rotogame.appspot.com/games/undefined../dojox/gfx.js

    How to create the build, which is usually only necessary after an update of
    Dojo:

     1. Run the following command in the dojo "buildscripts" directory:

            build.bat profile=rotogame action=clean,release optimize=shrinksafe

        Location of that directory ($version is the Dojo version number):

            /source/dojo-release-$version-src/util/buildscripts

        The resulting build is located in:

            /source/dojo-release-$version-src/release

      2. Update the files in, using the newly built versions:

             /javascript/dojotoolkit/dojo

  * Tasks recommended before deployment:

      + Validate HTML.

      + Test with popular browsers: Firefox, Chrome, Opera, Safari, IE6, IE7,
        IE8

      + Test with images turned off in Firefox.

      + Test with JavaScript turned off in Firefox.

      + Test via a mobile connection (with image compression) with IE8 and
        Firefox.


Images
------

GIF images exported from XARA should have transparency set. Otherwise, when
viewed via a T-Mobile Germany UMTS connection with image compression, some
unwanted color may turn transparent (as of June 2009).


License
=======

Copyright 2009–2015 [Felix E. Klee](mailto:felix.klee@inka.de)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at <http://www.apache.org/licenses/LICENSE-2.0>.

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.


[1]: http://rotogame.appspot.com/
[2]: http://www.chromeexperiments.com/detail/roto-game/
[3]: http://sq.rotogame.com/
[4]: https://github.com/feklee/rotogamesq
[5]: http://www.dojotoolkit.com/forum/dojo-foundation/general-discussion/firefox-3-fires-domcontentloaded-event-prematurely
