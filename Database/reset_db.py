# reset_db.py
import os
import shutil
from Database.tables_db import Base
from Database.functions_db import engine, inicializar_base_datos


def reset_database():
    """
    Elimina la base de datos existente y crea una nueva con los esquemas actuales.
    """
    db_path = os.path.join(os.path.dirname(__file__), 'Database/database.db')

    # Verificar si el archivo existe y eliminarlo
    if os.path.exists(db_path):
        print(f"Eliminando base de datos existente: {db_path}")
        os.remove(db_path)

    # Crear todas las tablas nuevamente
    print("Creando nuevo esquema de base de datos...")
    Base.metadata.create_all(engine)

    # Inicializar datos básicos
    inicializar_base_datos()

    print("¡Base de datos reiniciada correctamente!")


if __name__ == "__main__":
    reset_database()