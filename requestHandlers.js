var url = require("url"),
    fs = require("fs"),
    formidable = require("formidable"),
    sys = require("sys");

var mongo = require('mongodb');
var Server = mongo.Server;
var Db = mongo.Db;

var db = new Db('test', new Server("127.0.0.1", 27017, {}));

function start(request, response) {
  console.log("Request handler 'start' was called.");

  var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '</form>'+
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(request, response) {
  console.log("Request handler 'upload' was called.");

  var form = new formidable.IncomingForm();
  console.log("about to parse");
  try {
    form.parse(request, function(error, fields, files) {
      console.log("parsing done");
  
      /* Possible error on Windows systems:
         tried to rename to an already existing file */
      fs.rename(files.upload.path, "/home/ubuntu/images/" + files.upload.name, function(err) {
        if (err) throw new Error("Error saving file");
          db.open(function(err,db) {
            if (err) throw new Error("Error opening db");
            db.collection('pictures', function(err, collection) {
              if (err) throw new Error("Error opening collection");
              collection.insert({ image : files.upload.name, loc : [ 37, -124 ]},
                                { limit : 10 },
                                function(err, cursor) {
                                  
                if (err) throw new Error("Error executing insert");              
                collection.ensureIndex({ loc : "2d" }, function (err,indexName) {
                  if (err) throw new Error("Error creating index");              
                  
                  response.writeHead(200, {"Content-Type": "text/html"});
                  response.write("created or updated index:" + indexName + "<br/>");
                  response.write("received image:<br/>");
                  response.write("<img src='/show?image=" + files.upload.name + "' />");
                  response.end();
                  db.close();
                })
              })
            })
          })   
      });
    });
  }
  catch (err) {
    response.writeHead(500, {"Content-Type": "text/plain"});
    response.write(err)
    response.end();  
  } 
}

function show(request, response) {
  console.log("Request handler 'show' was called.");
  var url_obj = url.parse(request.url,true);
  fs.readFile("/home/ubuntu/images/" + url_obj.query['image'], "binary", function(error, file) {
    if(error) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(error + "\n");
      response.end();
    } else {
      response.writeHead(200, {"Content-Type": "image/png"});
      response.write(file, "binary");
      response.end();
    }
  });
}

function pictures_stream(request,response) {
  var url_obj = url.parse(request.url,true);
  ll = (url_obj.query['ll'] || "37,-124").split(",").map(function(x) { parseFloat(x) });
  
  try {
    db.open(function(err,db) {
      if (err) throw new Error("Error opening db");
      db.collection('pictures', function(err, collection) {
        if (err) throw new Error("Error opening collection");
        collection.find({ loc : { $near : [ 37, -124 ] , $maxDistance : 5 } }, { limit : 10 }, function(err, cursor) {
          if (err) throw new Error("Error executing find");
          cursor.each(function(err, doc) {
            if (err) throw new Error("Error opening doc");
            if(doc != null) {
              console.log("Doc from Each ");
              console.dir(doc);
            } else {                  
              response.writeHead(200, {"Content-Type": "text/plain"});
              response.write("Done");
              response.end();
              db.close();
            }
          })                  
        })
      })
    })
  } catch (err) {
    response.writeHead(500, {"Content-Type": "text/plain"});
    response.write(err.message)
    response.end();  
  }
  
}

exports.start = start;
exports.upload = upload;
exports.show = show;
exports.pictures_stream = pictures_stream;
