function fromCSV(body) {
	var r = body.split('\n') ;
	var header = r[0].split(',') ;

	return r.slice(1).map(function(line){
		var o = {} ;
		var fields = line.split(',');
		for (var i=0; i<fields.length; i++) {
			if (header[i] && fields[i])
				o[header[i]] = fields[i] ;
		}
		return o ;
	}) ;
}

function poll(config){
	var URL = require('url') ;
	var haproxy = URL.parse(config.proxyUrl) ;
	var http = require(haproxy.protocol.replace(/:$/,"")) ;
	var nodemailer = require('nodemailer') ;

	var mail = nodemailer.createTransport.apply(this,config.mail) ;
	
	var servers = {} ;
	
	function pollProxy() {
		var errors = [] ;
		
		function report(ex) {
			console.error(ex) ;
			errors.push(ex.toString()) ;
		}
		
		http.get(config.proxyUrl, function(str){
			str.on('error',report) ;
			var body = "" ;
			str.on('data', function (chunk) { 
				body += chunk ; 
			});
			str.on('end',function(){
				fromCSV(body).forEach(function(s){
					var server = s['# pxname']+" "+s.svname ;
					if (servers[server] != s.status) {
						report(s['# pxname']+" "+s.svname+": "+s.status) ;
						servers[server] = s.status ;
					}
				}) ;
				if (errors.length) {
					mail.sendMail({
					    from: config.to,
					    to: config.to,
					    subject: "HAProxy report: "+haproxy.host,
					    text: errors.join("\n")
					}, function(error, response){
						errors = [] ;
					    if(error){
					        report(error) ;
					    }
					});
				}
			}) ;
		}) ;
	}
	
	setInterval(pollProxy,config.poll*1000) ;
}

/* Sample config for watch.json

{
	"proxyUrl":"https://user:pass@www.example.com/haproxy?stats;csv",
	"poll":60, // Once a minute
	"to":"support@example.com",
	"mail":		// Arguments to nodemailer, e.g. Gmail
	["SMTP",{
	    "service": "Gmail",
	    "auth": {
	        "user": "admin@exmplae.com",
	        "pass": "mailPassWord"
	    }
	}]
}

/* Start polling with the required config */
poll(require('./watch.json')) ;
