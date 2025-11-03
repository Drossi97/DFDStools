"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Cerrar modal al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      // Prevenir scroll en el body cuando el modal está abierto
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  // Cerrar modal con la tecla Escape
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-[#002244] border-b border-gray-200">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#002b4d] transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
