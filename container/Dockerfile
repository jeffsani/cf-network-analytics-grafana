FROM grafana/grafana-oss:latest

ENV GF_INSTALL_PLUGINS=yesoreyeram-infinity-datasource
ENV GF_AUTH_ANONYMOUS_ENABLED=true
ENV GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
ENV GF_AUTH_BASIC_ENABLED=true
ENV GF_SECURITY_ALLOW_EMBEDDING=true
ENV GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s:%(http_port)s/
ENV GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/etc/grafana/provisioning/dashboards/cloudflare-network-analytics.json

COPY provisioning/datasources/ /etc/grafana/provisioning/datasources/
COPY provisioning/dashboards/ /etc/grafana/provisioning/dashboards/

EXPOSE 3000
