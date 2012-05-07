var http = require("http");
var url = require("url");
var globals = require("./globals");

var response_directory = {};

function start(route, handle) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    route(handle, pathname, request, response);
  }

  process.on('uncaughtException', function (err) {
    /*if (([index,err_string] = err.split("|||")) && (index in globals.response_directory)){
      response = globals.response_directory[index];
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(err)
      response.end();
      delete globals.response_directory.response;
    }*/
    console.log(err.fileName + ":" + err.lineNumber + " - " + err.message );
  })
  
  http.createServer(onRequest).listen(8080);
  console.log("Server has started.");
}

exports.start = start;
