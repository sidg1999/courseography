module Main where

import Control.Monad    (msum)
import Control.Monad.IO.Class (liftIO)
import Happstack.Server
import GridResponse
import GraphResponse
import DrawResponse
import ImageResponse
import PostResponse
--import AboutResponse
import Database.CourseQueries
import Css.CssGen
import Filesystem.Path.CurrentOS
import System.Directory
import qualified Data.Text as T
import Diagram

--instance (MonadIO m) => MonadIO (ServerPartT m)

main :: IO ()
main = do
    generateCSS
    cwd <- getCurrentDirectory
    let staticDir = encodeString $ parent $ decodeString cwd
    contents <- readFile "../README.md"
    simpleHTTP nullConf $
        msum [ dir "grid" gridResponse,
               dir "graph" graphResponse,
               dir "draw" drawResponse,
               dir "image" $ imageResponse,
               --dir "about" $ aboutResponse contents,
               dir "post" postResponse,
               dir "static" $ serveDirectory EnableBrowsing [] staticDir,
               dir "course" $ look "name" >>= retrieveCourse,
               dir "all-courses" $ liftIO allCourses,
               dir "svg" $ look "courses" >>= svgResponse
               ]

retrieveCourse :: String -> ServerPart Response
retrieveCourse course =
   liftIO $ queryCourse (T.pack course)

svgResponse :: String -> ServerPart Response
svgResponse courses = do
  liftIO $ renderTable courses
  -- Right now serving the file, but the client isn't doing anthing with it
  serveFile (asContentType "image/svg+xml") "circle.svg"
