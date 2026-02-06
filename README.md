📦 MiAlacena Pro
MiAlacena Pro es una solución inteligente para la gestión de suministros del hogar. Utiliza Inteligencia Artificial y tecnologías web modernas para transformar la tediosa tarea de hacer el inventario en un proceso automatizado y eficiente.
🚀 Características Principales
* 🤖 IA Vision Scanning: Identificación automática de productos mediante procesamiento de imágenes con el modelo Gemini 2.5 Flash. Olvídate de escribir nombres uno por uno.
* 📊 Inventario Dinámico: Seguimiento en tiempo real de existencias con alertas visuales de stock bajo.
* 👨‍🍳 Chef IA: Generación de recetas personalizadas basadas exclusivamente en los ingredientes que tienes en tu alacena actual.
* 🛒 Lista de Compras Inteligente: Se alimenta automáticamente de los productos que llegan al stock mínimo.
* 📱 Mobile First & PWA: Diseñada específicamente para ser instalada en Android/iOS con una experiencia de usuario fluida y nativa.
🛠️ Stack Tecnológico
* Frontend: React.js con TypeScript.
* Estilos: Tailwind CSS para una interfaz moderna y responsiva.
* Backend/Base de Datos: Firebase Cloud Firestore para sincronización en tiempo real.
* Autenticación: Firebase Auth (Soporta ingreso anónimo y por tokens).
* Inteligencia Artificial: Google Gemini API (Modelos 2.5 Flash y Flash Vision).
* Iconografía: Lucide React.
📦 Instalación y Configuración
Para ejecutar este proyecto localmente, sigue estos pasos:
1. Clonar el repositorio:
git clone [https://github.com/tu-usuario/mialacena-pro.git](https://github.com/tu-usuario/mialacena-pro.git)
cd mialacena-pro

2. Instalar dependencias:
npm install

3. Configurar variables de entorno:
Crea un archivo .env o configura tu objeto firebaseConfig en el código con tus credenciales de Firebase:
const firebaseConfig = {
 apiKey: "TU_API_KEY",
 authDomain: "tu-app.firebaseapp.com",
 projectId: "tu-app-id",
 storageBucket: "tu-app.appspot.com",
 messagingSenderId: "tu-id",
 appId: "tu-app-id"
};

4. Configurar Gemini API:
Asegúrate de tener una API Key válida de Google AI Studio y colocarla en el estado correspondiente dentro de App.tsx.
5. Iniciar el servidor de desarrollo:
npm start

📱 Despliegue como PWA / APK
Este repositorio está configurado para ser compatible con PWABuilder.
   * Despliega la app en un hosting (Vercel, Netlify, Firebase Hosting).
   * Ingresa la URL en PWABuilder.com.
   * Descarga el paquete para Android y genera tu archivo .apk.
🤝 Contribuciones
Las contribuciones son lo que hacen a la comunidad de código abierto un lugar increíble para aprender, inspirar y crear. Cualquier contribución que hagas será muy apreciada.
   1. Haz un Fork del proyecto.
   2. Crea tu rama de función (git checkout -b feature/AmazingFeature).
   3. Haz un Commit de tus cambios (git commit -m 'Add some AmazingFeature').
   4. Haz un Push a la rama (git push origin feature/AmazingFeature).
   5. Abre un Pull Request.
📄 Licencia
Distribuido bajo la Licencia MIT. Consulta LICENSE para más información.
Desarrollado con ❤️ para simplificar la vida en el hogar.
