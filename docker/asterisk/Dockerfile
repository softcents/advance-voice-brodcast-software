FROM alpine:3.20

RUN apk add --no-cache \
    asterisk \
    asterisk-sounds-en \
    asterisk-srtp \
    asterisk-sample-config \
    curl

COPY conf/ari.conf /etc/asterisk/ari.conf
COPY conf/http.conf /etc/asterisk/http.conf
COPY conf/pjsip.conf /etc/asterisk/pjsip.conf
COPY conf/extensions.conf /etc/asterisk/extensions.conf
COPY conf/rtp.conf /etc/asterisk/rtp.conf

RUN chown -R asterisk:asterisk /etc/asterisk /var/lib/asterisk /var/spool/asterisk /var/log/asterisk

EXPOSE 5060/udp 5060/tcp 8088 10000-10200/udp

USER asterisk

CMD ["/usr/sbin/asterisk", "-f", "-vvv"]
