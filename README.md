pollingApp
==========

Realtime polling app for UCT Physics. Uses node.js, socket.io and jQuery/jQM.
NOTE: no deps are stored in this repo, you must run npm install from project root to install deps!


In order to get decent redirection (hiding ports 3700), you need to change the httpd-vhosts.conf somewhat: 
#############
<VirtualHost *:80>    
	ServerName localhost
	ProxyRequests Off
	<Proxy *>
		Order deny,allow
		Allow from all
	</Proxy>
	ProxyPass /poll http://localhost:3700
	ProxyPassReverse /poll http://localhost:3700
</VirtualHost>
#############

You also need to enable the following modules in httpd.conf: proxy_http_module


