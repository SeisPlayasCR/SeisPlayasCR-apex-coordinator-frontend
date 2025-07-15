'use client'

import { useState } from 'react'
import axios from 'axios'

interface CustomerData {
  id: string
  Nombre: string
  Tipo: string
  Numero: string
  CorreoElectronico: string
}

export default function Home() {
  const [customerData, setCustomerData] = useState<CustomerData>({
    id: '',
    Nombre: '',
    Tipo: '01',
    Numero: '',
    CorreoElectronico: ''
  })

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerData.id || !customerData.Nombre || !customerData.Numero || !customerData.CorreoElectronico) {
      setError('Por favor, complete todos los campos requeridos')
      return
    }

    setLoading(true)
    setStatus('Enviando solicitud...')
    setError('')

    try {
      const response = await axios.post(
        `https://apex-coordinator.onrender.com/api/v1/send-factura/${customerData.id}`,
        {
          Nombre: customerData.Nombre,
          Tipo: customerData.Tipo,
          Numero: customerData.Numero,
          CorreoElectronico: customerData.CorreoElectronico
        }
      )

      // Use RespuestaXML from the response to get the base64 string
      // The 68th character (index 67) is the start of the base64 string in RespuestaXML
      if (response.data && response.data.solaria.RespuestaXML) {
        // Defensive: check length
        const respuestaXML: string = response.data.solaria.RespuestaXML
        if (respuestaXML.length >= 68) {
          // Get substring from position 68 (index 67) to the end
          const base64String = respuestaXML.substring(67)
          await processBase64Document(base64String)
        } else {
          setError('RespuestaXML no contiene la cadena base64 esperada')
        }
      } else {
        setError('No se recibió RespuestaXML del API')
      }
    } catch (err) {
      console.error('API call failed:', err)
      setError('Error al enviar la solicitud: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processBase64Document = async (base64String: string) => {
    try {
      setStatus('Procesando documento...')

      // Decode the base64 string
      // Use atob for browser compatibility
      let decodedXml: string
      try {
        decodedXml = atob(base64String)
      } catch {
        // Fallback for Node.js (unlikely in browser, but for SSR safety)
        decodedXml = Buffer.from(base64String, 'base64').toString('utf8')
      }

      // Extract NumeroConsecutivo for filename
      const consecutivoMatch = decodedXml.match(
        /<NumeroConsecutivo>(.*?)<\/NumeroConsecutivo>/
      )
      const consecutivo = consecutivoMatch ? consecutivoMatch[1] : Date.now().toString()

      // Create and download the XML file
      const blob = new Blob([decodedXml], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factura_${consecutivo}.xml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setStatus(`✅ XML guardado como 'factura_${consecutivo}.xml'`)
    } catch (err) {
      console.error('Failed to process document:', err)
      setError('Error al procesar el documento: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">
            Generador de Factura Electrónica
          </h1>
          <p className="text-amber-700">
            Ingrese los datos del cliente para generar la factura electrónica
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-amber-900 mb-2">
                  ID de Factura <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={customerData.id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors text-amber-900 bg-yellow-50 placeholder:text-amber-400"
                  placeholder="Ingrese el ID de la factura"
                  required
                />
              </div>

              <div>
                <label htmlFor="Nombre" className="block text-sm font-medium text-amber-900 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="Nombre"
                  name="Nombre"
                  value={customerData.Nombre}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors text-amber-900 bg-yellow-50 placeholder:text-amber-400"
                  placeholder="Ingrese el nombre del cliente"
                  required
                />
              </div>

              <div>
                <label htmlFor="Tipo" className="block text-sm font-medium text-amber-900 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="Tipo"
                  name="Tipo"
                  value={customerData.Tipo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors text-amber-900 bg-yellow-50 placeholder:text-amber-400"
                  placeholder="Ingrese el tipo de cliente (ej: 01)"
                  required
                />
              </div>

              <div>
                <label htmlFor="Numero" className="block text-sm font-medium text-amber-900 mb-2">
                  Número de Identificación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="Numero"
                  name="Numero"
                  value={customerData.Numero}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors text-amber-900 bg-yellow-50 placeholder:text-amber-400"
                  placeholder="Ingrese el número de identificación"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="CorreoElectronico" className="block text-sm font-medium text-amber-900 mb-2">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="CorreoElectronico"
                  name="CorreoElectronico"
                  value={customerData.CorreoElectronico}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-colors text-amber-900 bg-yellow-50 placeholder:text-amber-400"
                  placeholder="Ingrese el correo electrónico"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200 ${loading
                  ? 'bg-amber-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                } focus:ring-4 focus:ring-amber-300`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                'Generar Factura'
              )}
            </button>
          </form>

          {status && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{status}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-amber-700">
            Este sistema se conecta a la API de Apex Coordinator para generar facturas electrónicas.
          </p>
        </div>
      </div>
    </div>
  )
}
