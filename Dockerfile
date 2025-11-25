# 1. Node.js 18버전이 깔린 리눅스 컴퓨터를 빌려온다
FROM node:18

# 2. 그 컴퓨터 안에 /app 이라는 폴더를 만들고 거기로 들어간다
WORKDIR /app

# 3. 내 컴퓨터에 있는 package.json 파일들을 거기로 복사한다
COPY package*.json ./

# 4. npm install을 실행해서 라이브러리를 설치한다
RUN npm install

# 5. 나머지 모든 소스 코드를 복사해서 넣는다
COPY . .

# 6. 이 컨테이너는 3000번 포트를 쓴다고 알려준다
EXPOSE 3000

# 7. 서버를 실행한다
CMD ["node", "server.js"]