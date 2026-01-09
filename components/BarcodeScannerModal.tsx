
import React, { useEffect, useRef, useState } from 'react';

interface BarcodeScannerModalProps {
    onClose: () => void;
    onScanSuccess: (scannedCode: string) => void;
    mockTowelIds: string[]; // Kept for fallback/reference if needed, though not used in UI
}

// Declare the global variable loaded from the CDN script
declare const Html5QrcodeScanner: any;

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScanSuccess }) => {
    const [scanError, setScanError] = useState<string | null>(null);
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        // Initialize the scanner when component mounts
        const scannerId = "reader";
        
        // Wait a moment for the DOM element to be ready
        const timer = setTimeout(() => {
            try {
                if (typeof Html5QrcodeScanner === 'undefined') {
                    setScanError("La librería de escaneo no se cargó correctamente. Verifique su conexión.");
                    return;
                }

                const scanner = new Html5QrcodeScanner(
                    scannerId, 
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    /* verbose= */ false
                );

                scanner.render(
                    (decodedText: string) => {
                        // Success callback
                        // Play a beep sound (optional UX enhancement)
                        const audio = new Audio('https://freesound.org/data/previews/263/263133_2064400-lq.mp3'); 
                        audio.play().catch(e => console.log("Audio play failed", e)); // Catch errors if user hasn't interacted
                        
                        // Stop scanning and return result
                        scanner.clear().then(() => {
                            onScanSuccess(decodedText);
                        });
                    }, 
                    (errorMessage: string) => {
                        // Error callback (scanning in progress)
                        // We usually ignore this as it triggers on every frame with no code
                        // console.log(errorMessage);
                    }
                );

                scannerRef.current = scanner;

            } catch (err: any) {
                console.error("Error starting scanner", err);
                setScanError("No se pudo iniciar la cámara. Asegúrese de dar permisos.");
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error: any) => {
                    console.error("Failed to clear scanner", error);
                });
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full text-center border border-slate-200 relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-2xl font-bold"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold text-red-700 mb-2">Escáner Activo</h2>
                <p className="text-slate-600 mb-6">Coloque el código de barras o QR dentro del marco.</p>

                {/* Container for the library to render the video stream */}
                <div id="reader" className="w-full overflow-hidden rounded-lg bg-slate-100 border-2 border-slate-300 min-h-[300px]"></div>

                {scanError && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {scanError}
                    </div>
                )}

                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Cancelar Escaneo
                    </button>
                </div>
                
                <p className="mt-4 text-xs text-slate-400">
                    Toallas La Josefina - Sistema de Inventario
                </p>
            </div>
        </div>
    );
};
