FROM node
LABEL maintener="Thomas Champagne"
WORKDIR /build
ENV OUTDIR=/package
COPY . .
RUN npm install --unsafe-perm
CMD npm run package:webextension && cp ./package/* ${OUTDIR}
VOLUME ${OUTDIR}
