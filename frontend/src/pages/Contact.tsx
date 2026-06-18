import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Contato</h1>
        <p className="text-gray-400 mb-10">
          Quer conversar sobre uma oportunidade ou projeto? Me manda uma mensagem!
        </p>

        {/* Links */}
        <div className="flex gap-6 mb-10">
          <a href="https://www.linkedin.com/in/cesarcfw/" target="_blank"
            className="text-teal-400 hover:text-blue-300 transition text-sm">
            LinkedIn →
          </a>
          <a href="https://github.com/Cesarcfw" target="_blank"
            className="text-teal-400 hover:text-blue-300 transition text-sm">
            GitHub →
          </a>
          <a href="mailto:cesarcfwmaluf@gmail.com"
            className="text-teal-400 hover:text-blue-300 transition text-sm">
            E-mail →
          </a>
        </div>

        {/* Formulário */}
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6">Enviar mensagem</h2>

          {status === 'success' && (
            <div className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg px-4 py-3 mb-6 text-sm">
              Mensagem enviada com sucesso!
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 mb-6 text-sm">
              Erro ao enviar. Tenta novamente.
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Mensagem</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Sua mensagem..."
                rows={5}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={status === 'sending'}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition"
            >
              {status === 'sending' ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}