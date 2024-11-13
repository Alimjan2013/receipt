# Receipt 

An application that simplifies receipt organization through OCR (Optical Character Recognition) and Notion integration. Upload receipt images to extract text, automatically translate non-English content, and save the organized data directly to your Notion workspace.

## 🚀 Demo

Try it out: [Receipt App](https://receipt-self.vercel.app/)

## ✨ Features

- **Smart Receipt OCR**: Upload images of receipts to extract text and structure data automatically
- **Intelligent Translation**: Automatically detects and translates non-English receipts to English
- **Notion Integration**: Seamlessly save receipt data to your personal Notion workspace
- **Data Privacy**: Local browser storage for credentials, ensuring your Notion access remains private
- **Edit Before Save**: Review and modify extracted data before uploading to Notion
- **Multi-Currency Support**: Handles receipts in various currencies with EUR conversion

## 🔧 Setup

### Prerequisites
- OpenAI API key for translation and data structuring
- Notion account and integration token

### Notion Integration Setup

1. **Create Notion Integration**
   - Visit [Notion Developers](https://developers.notion.com/docs/create-a-notion-integration#getting-started)
   - Create a new integration and copy the token
   - Grant database access to your integration

2. **Configure Database**
   - Create a new Notion database or use an existing one
   - Share the database with your integration
   - Copy the database URL (the app will extract the ID automatically)

> 🔒 **Security Note**: Your Notion credentials are stored only in your browser's local storage and are never transmitted to our servers.

## 🛠️ Technologies

- **Frontend**: Next.js 15+, Shadcn/UI, TailwindCSS
- **OCR Engine**: Tesseract.js (browser-based processing)
- **AI Processing**: GPT-4 for translation and data structuring
- **Integration**: Notion API

## 🚀 Deploy Your Own

1. Clone the repository
```bash
git clone github.com/Alimjan2013/receipt.git
