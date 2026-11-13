FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY *.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY img/ /usr/share/nginx/html/img/
COPY vendor/ /usr/share/nginx/html/vendor/
COPY robots.txt sitemap.xml /usr/share/nginx/html/

EXPOSE 80
