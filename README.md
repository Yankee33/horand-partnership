<<<<<<< HEAD
# HORAND Partnership

Платформа для розподілу доходів між співвласниками компаній та проєктів.

## Стек

| Шар | Технологія |
|-----|-----------|
| Frontend | React + TypeScript + i18next |
| Backend | FastAPI (Python 3.11) |
| База даних | PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt) |
| Фото | Локально (`uploads/`) або DO Spaces |
| Deploy | Docker + docker-compose |

---

## Структура проєкту

```
horand/
├── backend/
│   ├── app/
│   │   ├── migrations/      # Alembic міграції
│   │   ├── models/          # SQLAlchemy моделі
│   │   ├── routers/         # API роутери
│   │   ├── schemas/         # Pydantic схеми
│   │   ├── services/        # auth, upload
│   │   ├── config.py
│   │   └── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml        # Локальна розробка
├── docker-compose.prod.yml   # Продакшн
├── .env.example
└── README.md
```

---

## Локальний запуск

### 1. Клонуй репозиторій

```bash
git clone https://github.com/your-username/horand.git
cd horand
```

### 2. Створи `.env`

```bash
cp .env.example .env
# Відредагуй .env — змінити паролі та SECRET_KEY
```

### 3. Запусти

```bash
docker-compose up --build
```

Після запуску:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/api/docs

### 4. Виконай міграції (якщо потрібно вручну)

```bash
docker-compose exec backend alembic upgrade head
```

---

## Запуск на сервері (DigitalOcean Droplet)

### 1. Підготовка Droplet

```bash
# Підключись до сервера
ssh root@YOUR_SERVER_IP

# Встанови Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y
```

### 2. Завантаж код на сервер

```bash
git clone https://github.com/your-username/horand.git
cd horand
```

### 3. Налаштуй `.env` для продакшну

```bash
cp .env.example .env
nano .env
```

Обов'язково зміни:
```env
POSTGRES_PASSWORD=STRONG_PASSWORD
SECRET_KEY=VERY_LONG_RANDOM_STRING_MIN_32_CHARS
FRONTEND_URL=https://yourdomain.com
REACT_APP_API_URL=https://yourdomain.com
```

### 4. Запусти в продакшн режимі

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5. Перевір статус

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Міграції бази даних

### Застосувати всі міграції

```bash
# Локально:
docker-compose exec backend alembic upgrade head

# На сервері:
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Створити нову міграцію (після зміни моделей)

```bash
docker-compose exec backend alembic revision --autogenerate -m "add new field"
```

### Відкотити міграцію

```bash
docker-compose exec backend alembic downgrade -1
```

---

## API Endpoints

### Auth
| Метод | URL | Опис |
|-------|-----|------|
| POST | `/api/auth/register` | Реєстрація |
| POST | `/api/auth/login` | Логін → JWT токен |
| GET | `/api/auth/me` | Профіль поточного користувача |

### Companies
| Метод | URL | Опис |
|-------|-----|------|
| GET | `/api/companies/` | Список компаній |
| POST | `/api/companies/` | Створити компанію |
| GET | `/api/companies/{id}` | Отримати компанію |
| PATCH | `/api/companies/{id}` | Оновити компанію |
| DELETE | `/api/companies/{id}` | Видалити компанію |
| POST | `/api/companies/{id}/co-owners/{co_id}/photo` | Завантажити фото |
| PUT | `/api/companies/{id}/income-rules` | Оновити правила доходів |

Повна документація: `http://localhost:8000/api/docs`

---

## Збереження фото

### Мінімум — локально (за замовчуванням)

Фото зберігаються в папку `backend/uploads/`.  
В docker-compose це volume `uploads_data` — дані зберігаються між перезапусками.

### Плюс — DigitalOcean Spaces

1. Створи Space в DO панелі (регіон nyc3 або інший)
2. Згенеруй Access Keys: DO → API → Spaces Keys
3. В `.env` встанови:

```env
USE_S3=true
S3_ENDPOINT_URL=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=your_key
S3_SECRET_KEY=your_secret
S3_BUCKET_NAME=your-bucket-name
S3_REGION=nyc3
```

4. Перезапусти бекенд:
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

---

## Генерація SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Корисні команди

```bash
# Переглянути логи
docker-compose logs -f backend
docker-compose logs -f db

# Зайти в контейнер
docker-compose exec backend bash
docker-compose exec db psql -U postgres -d horand

# Зупинити все
docker-compose down

# Зупинити і видалити дані БД
docker-compose down -v
```
=======
# horand-partnership
>>>>>>> 18a4d11ea87fcefc4d3b668e90f57bba84bd8362
