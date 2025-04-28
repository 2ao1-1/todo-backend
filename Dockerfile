FROM node:18-alpine

WORKDIR /usr/src/app

# تعطيل Husky لتجنب أخطاء الإعداد
ENV HUSKY=0

# تثبيت التبعيات
COPY package*.json ./
RUN npm install --production --ignore-scripts

# نسخ ملفات المشروع
COPY . .

EXPOSE 5000
CMD ["npm", "run", "server"]