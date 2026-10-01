import os
import shutil

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'app'))

# Create new directories
dirs_to_create = [
    'domain/entities',
    'domain/repositories',
    'domain/exceptions',
    'application/use_cases',
    'application/dtos',
    'infrastructure/database/models',
    'infrastructure/database/repositories',
    'infrastructure/web/api'
]

for d in dirs_to_create:
    os.makedirs(os.path.join(BASE_DIR, d), exist_ok=True)

# 1. Move schemas to application/dtos
schemas_dir = os.path.join(BASE_DIR, 'schemas')
dtos_dir = os.path.join(BASE_DIR, 'application', 'dtos')
if os.path.exists(schemas_dir):
    for item in os.listdir(schemas_dir):
        shutil.move(os.path.join(schemas_dir, item), dtos_dir)
    os.rmdir(schemas_dir)

# 2. Move models to infrastructure/database/models
models_dir = os.path.join(BASE_DIR, 'models')
infra_models_dir = os.path.join(BASE_DIR, 'infrastructure', 'database', 'models')
if os.path.exists(models_dir):
    for item in os.listdir(models_dir):
        shutil.move(os.path.join(models_dir, item), infra_models_dir)
    os.rmdir(models_dir)

# 3. Move api to infrastructure/web/api
api_dir = os.path.join(BASE_DIR, 'api')
infra_api_dir = os.path.join(BASE_DIR, 'infrastructure', 'web', 'api')
if os.path.exists(api_dir):
    for item in os.listdir(api_dir):
        shutil.move(os.path.join(api_dir, item), infra_api_dir)
    os.rmdir(api_dir)

# We leave app/core as is because config/security/database connection are cross-cutting/infra setups.

# 4. Replace imports in all python files
def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple replacements
    content = content.replace('app.schemas.', 'app.application.dtos.')
    content = content.replace('app.schemas ', 'app.application.dtos ')
    
    content = content.replace('app.models.', 'app.infrastructure.database.models.')
    content = content.replace('app.models ', 'app.infrastructure.database.models ')
    
    content = content.replace('app.api.', 'app.infrastructure.web.api.')
    content = content.replace('app.api ', 'app.infrastructure.web.api ')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Walk and replace
for root, _, files in os.walk(BASE_DIR):
    for file in files:
        if file.endswith('.py'):
            replace_in_file(os.path.join(root, file))

# Fix migrations/env.py which is outside app/
env_py = os.path.abspath(os.path.join(os.path.dirname(__file__), 'migrations', 'env.py'))
if os.path.exists(env_py):
    replace_in_file(env_py)

print("Refactor script completed successfully.")
