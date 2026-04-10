# Docker Run Guide

คู่มือนี้อธิบายวิธีรันโปรเจกต์แบบแยก container ทีละตัว โดยไม่ใช้ `docker compose`.

> เป้าหมายการใช้งานประจำวัน: รันผ่าน Docker Desktop (กด Start/Stop) โดยไม่ต้อง `npm run dev`.

## โครงสร้างที่ต้องรู้

- Backend container: รัน API ที่พอร์ต `3000` และ map ออกมาที่ [http://localhost:3002](http://localhost:3002)
- Frontend container: รันเว็บที่พอร์ต `80` และ map ออกมาที่ [http://localhost:5173](http://localhost:5173)
- Frontend จะเรียก API ผ่านชื่อ container `app-backend` ตามไฟล์ [frontend/Docker/nginx.conf](frontend/Docker/nginx.conf)

## 1) สร้าง network สำหรับให้ container คุยกัน

```powershell
docker network create basewebsite-net
```

## 2) Build backend image

รันจากโฟลเดอร์โปรเจกต์หลัก:

```powershell
docker build -t app-backend-local -f backend/Dockerfile backend
```

## 3) Run backend container

```powershell
docker run -d ^
  --name app-backend ^
  --network basewebsite-net ^
  --restart unless-stopped ^
  -p 3002:3000 ^
  --env-file backend/.env.local ^
  -e PORT=3000 ^
  app-backend-local
```

ไฟล์ `.env.local` ของ backend จะถูกส่งเข้า container ตอนรัน เพื่อให้ Supabase credentials และ table/schema ใช้งานได้เหมือนรันนอก Docker.

ถ้าต้องการแยกข้อมูลของแต่ละคน ให้ใส่ `DATABASE_URL` คนละค่าในคำสั่ง `docker run` ของ backend แต่ละ container.

## 4) Build frontend image

```powershell
docker build -t app-frontend-local -f frontend/Docker/Dockerfile frontend
```

## 5) Run frontend container

```powershell
docker run -d ^
  --name app-frontend ^
  --network basewebsite-net ^
  --restart unless-stopped ^
  -p 5173:80 ^
  app-frontend-local
```

## 6) ตรวจสอบการทำงาน

```powershell
docker ps --filter "name=app-backend" --filter "name=app-frontend"
curl.exe http://localhost:3002/api/health
```

> บน PowerShell แนะนำใช้ `curl.exe` เพื่อหลีกเลี่ยง prompt ของ `Invoke-WebRequest` alias.

เปิดเว็บที่:

[http://localhost:5173](http://localhost:5173)

## ถ้าต้องการรันแบบแยกกันจริง ๆ

1. สร้าง backend container คนละชื่อ และตั้ง `DATABASE_URL` คนละชุด
2. ใช้ frontend container เดิมได้ ถ้า network เดียวกันและ backend container ชื่อ `app-backend`
3. ถ้าจะเปลี่ยนชื่อ backend container ต้องแก้ `proxy_pass` ใน [frontend/Docker/nginx.conf](frontend/Docker/nginx.conf) ให้ตรงกับชื่อใหม่

## คำสั่งที่ใช้บ่อย

```powershell
docker logs -f app-backend
docker logs -f app-frontend
docker stop app-frontend app-backend
docker rm app-frontend app-backend
```

## การใช้งานแบบกดผ่าน Docker Desktop (ไม่ใช้ terminal)

หลังจากทำข้อ 1-5 ครั้งแรกเรียบร้อยแล้ว:

1. เปิด Docker Desktop
2. ไปที่ Containers
3. กด Start ที่ `app-backend` และ `app-frontend`
4. เข้าใช้งานที่ [http://localhost:5173/loginPage](http://localhost:5173/loginPage)

เมื่อต้องการหยุดระบบ ให้กด Stop ที่ทั้งสอง container ได้เลย.

> หมายเหตุ: `npm run dev` (พอร์ต 5173) ใช้เฉพาะตอนพัฒนา frontend แบบ hot reload เท่านั้น
> สำหรับการใช้งานทั่วไป ให้ใช้ Docker ที่พอร์ต 5173
> ห้ามรันพร้อมกันกับ Docker frontend บนพอร์ตเดียวกัน เพราะจะชนพอร์ต `5173`

## หมายเหตุ

- โปรเจกต์นี้ไม่ได้ใช้ volume สำหรับเก็บข้อมูลใน Docker โดยตรง ข้อมูลหลักอยู่ที่ฐานข้อมูล Neon ผ่าน `DATABASE_URL`
- ถ้าต้องการรันหลายชุดพร้อมกัน ให้ใช้ backend หลาย container และตั้ง `DATABASE_URL` แยกกัน