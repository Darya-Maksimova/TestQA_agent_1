import { tool } from "@opencode-ai/plugin"

export default tool({
    description: "Получить страницу Confluence по pageId",

    args: {
        pageId: tool.schema.string()
    },

    async execute(args) {
        let baseUrl = process.env.CONFLUENCE_URL
        const email = process.env.CONFLUENCE_EMAIL
        const token = process.env.CONFLUENCE_API_TOKEN

        if (!baseUrl || !email || !token) {
            throw new Error("Не заданы переменные окружения Confluence (URL, EMAIL, TOKEN)")
        }

        // Очищаем URL от слеша на конце и от /wiki, если они там есть
        baseUrl = baseUrl.replace(/\/$/, "").replace(/\/wiki$/, "")

        const auth = Buffer.from(`${email}:${token}`).toString("base64")

        // Формируем правильный URL
        const url = `${baseUrl}/wiki/api/v2/pages/${args.pageId}?body-format=storage`
        console.log("Запрос к Confluence:", url) // Это появится в логах OpenCode

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${auth}`,
                    Accept: "application/json"
                }
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Ошибка API ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            return JSON.stringify(data)

        } catch (error) {
            throw new Error(`Ошибка при запросе к Confluence: ${error.message}`)
        }
    }
})