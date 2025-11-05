from dotenv import load_dotenv

import os
from sqlalchemy import create_engine
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders


def get_engine():
    load_dotenv()

    SERVER = os.environ.get("SERVER")
    DB = os.environ.get("DB")
    USER = os.environ.get("USER")
    PWD = os.environ.get("PWD")
    DRIVER = "ODBC Driver 18 for SQL Server"

    connection_string = (
        f"mssql+pyodbc://{USER}:{PWD}@{SERVER}/{DB}?driver={DRIVER}&TrustServerCertificate=yes"
    )

    engine = create_engine(connection_string)

    return engine




def enviar_email(destinatario, assunto, corpo, caminho_anexo=None):
    # Configurações do Gmail
    remetente = 'astemobrake@gmail.com'

    senha = os.environ.get("EMAIL")  # Gama Avisos
    dest = destinatario.split(";")
    destinatarios = [ x.strip() for x in dest ]

    # Criando o objeto do e-mail
    msg = MIMEMultipart()
    msg['From'] = remetente
    # msg['To'] = destinatario
    msg['Subject'] = assunto

    # Adicionando o corpo do e-mail
    msg.attach(MIMEText(corpo, 'plain'))

    try:

        if caminho_anexo:
            with open(caminho_anexo, "rb") as anexo:
                part = MIMEBase("application","octet-stream")
                part.set_payload(anexo.read())

                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",f"attachment; filename={os.path.basename(caminho_anexo)}"
                )
                msg.attach(part)

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(remetente, senha)

        # Enviando o e-mail
        msg['To'] = ", ".join(destinatarios)
        try:
            server.send_message(msg)
            print(f'Email enviado com sucesso para {dest}!')
        except Exception as e:
            print(f'Ocorreu um erro ao enviar o email para {dest}: {e}')

    except Exception as e:
        print(f'Ocorreu um erro ao enviar o email: {e}')

    finally:
        # Fechando a conexão com o servidor
        server.quit()
