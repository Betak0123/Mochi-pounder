FROM node:17

#Setup a working directory 
WORKDIR /usr/src/app

#COPY package.json
COPY package*.json ./

# Install prettier becayse..
RUN npm install prettier -g

# install files 
RUN npm install

#COPY Spurce files 
COPY . . 

CMD ["node", "build index.js"]


