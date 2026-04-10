# Docker Run Guide

คู่มือนี้อธิบายวิธีรันโปรเจกต์แบบแยก container ทีละตัว โดยไม่ใช้ `docker compose`.

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
  -p 3002:3000 ^
  -e PORT=3000 ^
  app-backend-local
```

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
  -p 8080:80 ^
  app-frontend-local
```

## 6) ตรวจสอบการทำงาน

```powershell
curl.exe http://localhost:3002/api/health
```

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

## หมายเหตุ

- โปรเจกต์นี้ไม่ได้ใช้ volume สำหรับเก็บข้อมูลใน Docker โดยตรง ข้อมูลหลักอยู่ที่ฐานข้อมูล Neon ผ่าน `DATABASE_URL`
- ถ้าต้องการรันหลายชุดพร้อมกัน ให้ใช้ backend หลาย container และตั้ง `DATABASE_URL` แยกกัน