import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración del servidor de correo
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USER = os.environ.get("EMAIL_USER", "tu_correo@gmail.com")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "tu_password_o_app_password")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "RentHub <tu_correo@gmail.com>")

def send_registration_email(user_email, user_name):
    """
    Envía un correo electrónico de bienvenida después del registro
    
    Args:
        user_email (str): Correo electrónico del usuario
        user_name (str): Nombre del usuario
    
    Returns:
        bool: True si el correo se envió correctamente, False en caso contrario
    """
    try:
        # Imprimir información de depuración
        print(f"Intentando enviar correo usando:")
        print(f"HOST: {EMAIL_HOST}")
        print(f"PUERTO: {EMAIL_PORT}")
        print(f"USUARIO: {EMAIL_USER}")
        print(f"CONTRASEÑA: {'*' * len(EMAIL_PASSWORD) if EMAIL_PASSWORD else 'No configurada'}")
        
        # Crear mensaje
        message = MIMEMultipart()
        message["From"] = EMAIL_FROM
        message["To"] = user_email
        message["Subject"] = "¡Bienvenido a RentHub!"

        # Contenido HTML del correo
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Arial', sans-serif; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
                .footer {{ color: #6c757d; font-size: 12px; text-align: center; margin-top: 20px; }}
                .btn {{ display: inline-block; background-color: #0d6efd; color: white; text-decoration: none; padding: 10px 20px; 
                      border-radius: 5px; margin-top: 15px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>¡Bienvenido a RentHub!</h1>
                </div>
                <div class="content">
                    <p>Hola <strong>{user_name}</strong>,</p>
                    <p>¡Gracias por registrarte en RentHub! Estamos emocionados de tenerte como parte de nuestra comunidad.</p>
                    <p>Ahora puedes comenzar a explorar los mejores salones de eventos disponibles o publicar tus propios espacios.</p>
                    <p><a href="http://localhost:8000/propiedades" class="btn">Explorar salones</a></p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p>¡Saludos!</p>
                    <p>El equipo de RentHub</p>
                </div>
                <div class="footer">
                    <p>Este correo fue enviado a {user_email}. Si no te registraste en RentHub, puedes ignorar este mensaje.</p>
                    <p>&copy; 2023 RentHub. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Adjuntar el contenido HTML
        message.attach(MIMEText(html, "html"))

        # Establecer conexión con el servidor SMTP
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.ehlo()  # Identificarse con el servidor
            server.starttls()  # Habilitar la encriptación TLS
            server.ehlo()  # Re-identificarse con la conexión TLS
            
            # Iniciar sesión
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            
            # Enviar correo
            server.send_message(message)
        
        print(f"Correo de bienvenida enviado a {user_email}")
        return True
    except Exception as e:
        print(f"Error al enviar correo de bienvenida: {str(e)}")
        return False

def send_test_email():
    """Función para probar la configuración de correo"""
    try:
        # Crear mensaje de prueba simple
        message = MIMEMultipart()
        message["From"] = EMAIL_FROM
        message["To"] = EMAIL_USER  # Enviar a la misma cuenta para prueba
        message["Subject"] = "Prueba de envío de correo - RentHub"
        
        # Cuerpo simple del mensaje
        message.attach(MIMEText("Este es un correo de prueba para verificar la configuración SMTP.", "plain"))
        
        # Establecer conexión con el servidor SMTP con más información de depuración
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.set_debuglevel(1)  # Habilitar logs detallados
            print("Conectando al servidor SMTP...")
            server.ehlo()
            print("Iniciando TLS...")
            server.starttls()
            server.ehlo()
            print(f"Intentando iniciar sesión con {EMAIL_USER}...")
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            print("Sesión iniciada correctamente")
            print("Enviando mensaje...")
            server.send_message(message)
            print("Mensaje enviado correctamente")
        
        print(f"Correo de prueba enviado a {EMAIL_USER}")
        return True
    except Exception as e:
        print(f"Error en la prueba de correo: {str(e)}")
        return False

# Si se ejecuta este archivo directamente, realizar una prueba
if __name__ == "__main__":
    print("Ejecutando prueba de envío de correo...")
    send_test_email()
