Courseography
=============

About
--------------------------------------

Here at the University of Toronto, we have hundreds of courses to choose from, and it can be hard to navigate prerequisite chains, program requirements, and term-by-term offerings all at once. That's where Courseography comes in: by presenting course and scheduling information in a set of graphical interactive tools, we make it easier to choose the right courses for your academic career. Whether it's making sure you'll satisfy all the prerequities for that 4th year course you really want to take, or fitting together fragments of your schedule for next term, we hope Courseography makes your life easier!

Courseography was started in late 2013 by [David Liu](http://www.cs.toronto.edu/~david/). However, it wasn't until he recruited [Ian Stewart-Binks](http://www.cs.toronto.edu/~iansb/) to the project that things really got rolling. Though the past two years have really seen our tools take off within the CS student body, there's still a long way for us to go. Our current projects include moving the front-end of the application over to [React](https://facebook.github.io/react/), unifying the graph viewing and drawing tools, and improved exporting and report generation.


Getting Involved
--------------------------------------

See [CONTRIBUTING.md](https://github.com/Courseography/courseography/blob/master/CONTRIBUTING.md).

Say hello on our [Slack channel][slackin]! ![Slack][slackin-badge]

Click [here](/privacy) to learn about our Privacy Policy.


Running and Courseography Setup
--------------------------------------
For a more indepth tutorial click [here](https://github.com/Courseography/courseography/wiki/Installing-Courseography).

*This assumes a local copy is already setup.*

##### Software Dependencies
1. [Stack](https://docs.haskellstack.org/en/stable/README/)
2. [ImageMagick](http://www.imagemagick.org/script/binary-releases.php)

##### Other Files
*You can also do these two steps manually.*

1. Generate app/DevelopmentConfig.hs to app/Config.hs with `$ cp app/DevelopmentConfig.hs app/Config.hs`
2. Create the db folder with `$ mkdir db`

#### Installing
1. Install GHC 7.10.3 with `$ cp app/Development`
2. Compile Courseography with `$ stack build`

#### Parsing and Generation
1. Create database file for an parse prerequisite graph `$ stack exec courseography graphs`
2. Parse course information `$ stack exec courseography database`
3. Generate the CSS `$ stack exec courseography css`

#### Running
1. Run `$ stack exec courseography` to start the server
2. Navigate to `http://localhost:8000/graph` in your browser


Development Information
--------------------------------------

Courseography is powered by [Haskell](https://www.haskell.org/).

More information about the project, including code and commit style guides, can be found in the [wiki](https://github.com/Courseography/courseography/wiki).


Contributors
--------------------------------------

This project would not exist without the contributions of many students in the Department of Computer Science. In alphabetical order, our contributors are:

Alex Baluta, Alexander Biggs, Kelly Bell, Christina Chen, Eugene Cheung, Spencer Elliott, Ryan Fan, Christian Garcia, Ross Gatih, Philip Kukulak, Tamara Lipowski, Lydia Liu, Jahnavi Matholia, Christine Murad, San Shaftoe, Ian Stewart-Binks


[slackin]: https://courseography-slack.herokuapp.com/
[slackin-badge]: https://courseography-slack.herokuapp.com/badge.svg
