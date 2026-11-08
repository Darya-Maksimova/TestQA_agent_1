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

        // ИСПОЛЬЗУЕМ API v1: /wiki/rest/api/content/ + параметр expand для получения тела страницы
        const url = `${baseUrl}/wiki/rest/api/content/${args.pageId}?expand=body.storage`
        console.log("Запрос к Confluence (v1):", url) // Для логов

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

            // Достаем именно текст (HTML) из ответа, чтобы отдать его агенту
            const pageBody = data.body?.storage?.value || "Тело страницы пусто или недоступно"
            const pageTitle = data.title || "Без названия"

            return JSON.stringify({
                title: pageTitle,
                content: pageBody
            }, null, 2)

        } catch (error) {
            throw new Error(`Ошибка при запросе к Confluence: ${error.message}`)
        }
    }
})