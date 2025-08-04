Phase 1: Foundation & Setup - Detailed Plan (v2: Self-Hosted Vector DB)
Duration: 2 Weeks
Primary Goal: To establish a fully functional, authenticated, and deployable foundation for all microservices. By the end of this phase, a merchant should be able to install the app, and the frontend should be able to make an authenticated request to the backend. Ключевое изменение: Python-микросервис будет использовать self-hosted векторную базу данных (ChromaDB) вместо Pinecone.

Архитектурное решение: Отказ от Pinecone в пользу Self-Hosted
В соответствии с вашим решением, мы не будем использовать внешний сервис Pinecone. Вместо этого, Python-микросервис будет самостоятельно управлять созданием, хранением и поиском векторов.

Для этой задачи мы будем использовать ChromaDB. Это open-source векторная база данных, которая идеально подходит для нашего MVP, так как она:

Python-native: Легко интегрируется в наш Python-сервис.

Поддерживает CRUD: Имеет встроенные функции для создания, чтения, обновления и удаления векторов, что напрямую отвечает на ваши вопросы.    

Persistent Storage: Может сохранять данные на диск, что критически важно для нашего docker-compose окружения и последующего развертывания.

Ответы на ваши ключевые вопросы:
1. Если товар будет удален из Shopify, сможем ли мы убрать его из нашей векторной БД?
   Да, сможем. Это будет реализовано следующим образом:

Shopify Webhook: Мы подпишемся на веб-хук products/delete.    

NestJS-сервис: При получении этого веб-хука, наш основной бэкенд извлечет product_id удаленного товара.

API-вызов: NestJS вызовет специальный эндпоинт на Python-сервисе, например, DELETE /api/vectors, передав ему product_id.

Python-сервис: Python-сервис, используя ID товара, вызовет метод collection.delete(ids=["product_id_123"]) в ChromaDB, который надежно удалит вектор и связанные с ним метаданные.    

2. Если изменится описание товара, сможем ли мы изменить именно его в векторе?
                                                                                                                                                                                     Да, и это ключевое преимущество. Нам не нужно перестраивать всю базу.

Shopify Webhook: Мы подпишемся на веб-хук products/update.    

NestJS-сервис: При получении этого веб-хука, NestJS получит обновленные данные товара.

API-вызов: NestJS вызовет эндпоинт POST /api/vectors/upsert на Python-сервисе. В теле запроса будут переданы:

id: ID товара (product_id).

document: Новый текст описания для векторизации.

metadata: Обновленные метаданные (цена, остатки и т.д.).

Python-сервис: Python-сервис использует метод collection.upsert(...) в ChromaDB.  Этот метод атомарно выполняет операцию "обновить, если существует, или создать, если не существует". Он найдет существующий вектор по    

product_id, удалит его и добавит новый, сгенерированный из обновленного описания.

3. Нужно ли нам каждый раз перевекторизировать весь список товаров?
   Нет, не нужно. Благодаря возможности точечного обновления и удаления по ID, мы будем обрабатывать только те товары, которые были изменены. Это делает систему чрезвычайно эффективной и экономичной с точки зрения вычислительных ресурсов. Полная переиндексация каталога не потребуется для рутинных операций.

Week 1: Project Initialization & Local Environment (Updated)
Focus: Getting individual projects set up and running locally with the new self-hosted architecture.

1.1. DevOps Team Tasks
Objective: Provide the core infrastructure and local development environment, адаптированный под ChromaDB.

Tasks:

Create Shopify Partner Account & Git Repos: (Без изменений)

Provision Cloud Infrastructure (Staging): (Без изменений)

Local Development Environment (Updated):

Обновить docker-compose.yml.

Сервисы: postgres, redis, nestjs_app, python_app.

Новое требование: Настроить постоянный том (persistent volume) для python_app контейнера. Этот том будет монтироваться в директорию внутри контейнера, где ChromaDB будет хранить свои файлы. Это критически важно, чтобы векторная база не терялась при каждом перезапуске Docker-контейнера.

Initial Dockerfiles: (Без изменений)

1.2. Backend (NestJS) Team Tasks
Objective: Initialize the NestJS application, establish a database connection, and create the basic module structure.

Tasks:

Initialize NestJS Project & Project Structure: (Без изменений)

Database Integration (PostgreSQL): (Без изменений)

Health Check & Environment Configuration: (Без изменений)

1.3. AI (Python) Team Tasks
Objective: Initialize the FastAPI service, интегрировать ChromaDB и определить API-контракт.

Tasks:

Initialize FastAPI Project:

Установить зависимости: fastapi, uvicorn, pydantic, chromadb.

ChromaDB Integration:

Настроить ChromaDB-клиент для работы в режиме PersistentClient, указав путь для хранения данных внутри Docker-контейнера (например, /data/chroma).

Написать код для создания или загрузки коллекции при старте сервиса (client.get_or_create_collection(...)).

API Contract Definition (Updated):

Определить Pydantic-модели для новых эндпоинтов.

POST /upsert: Принимает id, document, metadata.

POST /retrieve: Принимает query_text, top_k, filter_metadata.

DELETE /delete: Принимает массив ids.

Stub Endpoints:

Реализовать маршруты для /upsert, /retrieve, /delete. Логика должна вызывать соответствующие методы ChromaDB и возвращать подтверждение или mock-данные.

Health Check: (Без изменений)

1.4. Frontend (React) Team Tasks
Objective: Create the basic Shopify embedded app shell.

Tasks: (Без изменений)

Week 2: Core Connections & Authentication (Updated)
Focus: Making the services communicate with each other and implementing the full Shopify authentication flow.

2.1. DevOps Team Tasks
Objective: Automate the deployment process and secure the infrastructure.

Tasks:

CI/CD Pipelines (GitHub Actions): (Без изменений)

Secret Management: (Без изменений)

DNS and Networking: (Без изменений)

2.2. Backend (NestJS) Team Tasks
Objective: Implement the Shopify OAuth flow and establish communication with the Python service.

Tasks:

Implement Shopify OAuth Flow: (Без изменений)

Session Token Validation: (Без изменений)

Create Protected Endpoint: (Без изменений)

Inter-Service Communication:

Использовать NestJS HttpModule для вызова эндпоинта /health на Python-сервисе, чтобы подтвердить сетевую связность.

2.3. AI (Python) Team Tasks
Objective: Ensure the service is deployable and its API is stable with a persistent ChromaDB.

Tasks:

Refine API Models: (Без изменений)

Deployment Verification:

Работать с командой DevOps, чтобы убедиться, что Python-сервис корректно развертывается через CI/CD.

Важно: Проверить, что при развертывании в облаке (Cloud Run/Fargate) используется постоянное хранилище (например, EFS или аналоги), чтобы данные ChromaDB не терялись между развертываниями.

Проверить, что все эндпоинты (/health, /upsert, /retrieve, /delete) работают в staging-окружении.

2.4. Frontend (React) Team Tasks
Objective: Implement the client-side authentication flow and connect to the backend.

Tasks: (Без изменений)

Phase 1: Definition of Done (Updated)
[ ] DevOps: Разработчик может запустить всю среду локально через docker-compose up, при этом данные ChromaDB сохраняются между перезапусками. CI/CD пайплайны для всех сервисов настроены и работают.

[ ] Backend (NestJS): Приложение успешно устанавливается через OAuth. Токены доступа сохраняются в PostgreSQL. Защищенный эндпоинт /api/internal/shops/me работает и возвращает данные.

[ ] AI (Python): Сервис развернут в staging-окружении с постоянным хранилищем для ChromaDB. Эндпоинты /health, /upsert, /retrieve, /delete доступны и возвращают корректно отформатированные (mock) данные.

[ ] Frontend (React): Приложение встраивается в админ-панель Shopify. После установки отображается дашборд с URL магазина, полученным от аутентифицированного бэкенда NestJS.