# invaders-frontend/Dockerfile
FROM node:18

WORKDIR /invaders-paris

COPY . .

RUN npm install
RUN npm run build

# On sert les fichiers build via un serveur HTTP
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
