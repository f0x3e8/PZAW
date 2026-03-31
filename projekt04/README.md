Sklonować z Githuba, następnie wpisać komendy w terminal:

Następnie wygenerować plik .env z losowym kluczem PEPPER:
1. Windows (cmd/PowerShell): node -e "require('fs').writeFileSync('.env','PEPPER='+require('crypto').randomBytes(32).toString('base64'))"
2. npm install
3. npm start

Logowanie do admina:
- login: admin
- haslo: admin
