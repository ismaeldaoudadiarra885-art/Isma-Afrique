
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Submission } from '../types';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { createHash } from '../utils/cryptoUtils';

interface SecureTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'sender' | 'receiver';
    submissions?: Submission[]; // Requis pour mode sender
    onTransferComplete?: () => void; // Callback après succès
}

const SecureTransferModal: React.FC<SecureTransferModalProps> = ({ isOpen, onClose, mode, submissions, onTransferComplete }) => {
    const { activeProject, addSubmission } = useProject();
    const { addNotification } = useNotification();
    
    // State Sender
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [qrData, setQrData] = useState<string>('');
    const [currentChunk, setCurrentChunk] = useState(0);
    const [totalChunks, setTotalChunks] = useState(0);

    // State Receiver
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState<'waiting' | 'scanning' | 'success' | 'error'>('waiting');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && mode === 'sender' && submissions && submissions.length > 0) {
            generateQRCodes();
        } else if (isOpen && mode === 'receiver') {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen, mode, submissions]);

    // --- LOGIQUE ÉMETTEUR (QR GEN) ---
    
    const generateQRCodes = async () => {
        const payload = {
            projectId: activeProject?.id,
            projectName: activeProject?.name,
            count: submissions?.length,
            data: submissions,
            generatedAt: new Date().toISOString()
        };

        const jsonString = JSON.stringify(payload);
        const signature = await createHash(jsonString);
        const signedPayload = JSON.stringify({ ...payload, signature });

        setQrData(signedPayload);
        setTotalChunks(1);
        
        if (canvasRef.current) {
            // Fallback mechanism if QRCode import behaves differently in some environments
            const qrLib = QRCode;
            if (qrLib && typeof qrLib.toCanvas === 'function') {
                qrLib.toCanvas(canvasRef.current, signedPayload, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                }, (error) => {
                    if (error) console.error(error);
                });
            } else {
                console.error("QRCode library not loaded correctly");
                addNotification("Erreur de chargement de la bibliothèque QR Code", "error");
            }
        }
    };

    const handleDownloadFile = () => {
        if (!qrData) return;
        const blob = new Blob([qrData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transfert_isma_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addNotification("Fichier de transfert généré (USB/OTG).", "success");
    };

    // --- LOGIQUE RÉCEPTEUR (SCANNER & FICHIER) ---

    const startScanner = async () => {
        setScanStatus('scanning');
        setIsScanning(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true"); 
                videoRef.current.play();
                requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error("Erreur caméra (normale sur PC sans webcam):", err);
            setScanStatus('error');
            // Ne pas afficher d'erreur bloquante, l'utilisateur peut utiliser le fichier
        }
    };

    const stopScanner = () => {
        setIsScanning(false);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const tick = () => {
        if (!videoRef.current || !scannerCanvasRef.current || !isScanning) return;
        
        const video = videoRef.current;
        const canvas = scannerCanvasRef.current;
        const context = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            // Check if jsQR is loaded
            if (typeof jsQR !== 'function') {
                console.error("jsQR library not loaded correctly");
                return;
            }
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                processReceivedData(code.data);
            } else {
                requestAnimationFrame(tick);
            }
        } else {
            requestAnimationFrame(tick);
        }
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            if (content) processReceivedData(content);
        };
        reader.readAsText(file);
    };

    const processReceivedData = async (data: string) => {
        stopScanner();
        setScanStatus('success');
        try {
            const parsed = JSON.parse(data);
            
            if (parsed.projectId !== activeProject?.id) {
                if(!window.confirm(`Ce fichier appartient au projet "${parsed.projectName}". Voulez-vous quand même importer ?`)) {
                    setScanStatus('scanning');
                    startScanner();
                    return;
                }
            }

            const newSubmissions = parsed.data as Submission[];
            let importedCount = 0;
            
            newSubmissions.forEach(sub => {
                // Marquer comme synchronisé
                const importedSub = { ...sub, status: 'synced' as const }; 
                addSubmission(importedSub);
                importedCount++;
            });

            addNotification(`${importedCount} soumissions importées avec succès !`, "success");
            if (onTransferComplete) onTransferComplete();
            onClose();

        } catch (e) {
            console.error(e);
            addNotification("Données invalides ou corrompues.", "error");
            setScanStatus('scanning');
            startScanner();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex flex-col items-center justify-center p-4 text-white">
            
            {/* Header Sécurisé */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <h2 className="text-lg font-mono tracking-widest text-green-400 uppercase">
                        {mode === 'sender' ? 'ÉMISSION SÉCURISÉE' : 'RÉCEPTION SÉCURISÉE'}
                    </h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white uppercase text-xs font-bold border border-gray-600 px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                    Fermer
                </button>
            </div>

            {/* Contenu */}
            <div className="w-full max-w-md flex flex-col items-center">
                
                {mode === 'sender' ? (
                    <div className="bg-white p-4 rounded-2xl shadow-2xl animate-fadeIn w-full">
                        <div className="flex flex-col items-center">
                            <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
                            <p className="text-gray-500 text-xs font-mono mt-2 break-all">Hash: {qrData.substring(0, 20)}...</p>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <div className="text-center">
                                <p className="text-sm text-gray-800 font-bold mb-1">Option 1 : Scan Optique</p>
                                <p className="text-xs text-gray-500">Faites scanner le code ci-dessus par le superviseur.</p>
                            </div>
                            
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OU (Pas de caméra)</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <button onClick={handleDownloadFile} className="w-full py-3 bg-gray-100 text-gray-800 font-bold rounded-lg border border-gray-300 hover:bg-gray-200 flex items-center justify-center gap-2">
                                <span>💾</span> Sauvegarder le fichier (USB)
                            </button>
                        </div>

                        <button onClick={() => { if(onTransferComplete) onTransferComplete() }} className="mt-4 w-full py-2 text-indigo-600 font-bold text-sm hover:underline">
                            J'ai terminé le transfert
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-6">
                        {/* Option Caméra */}
                        <div className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 ${scanStatus === 'error' ? 'border-red-500/50' : 'border-green-500/50'} shadow-[0_0_50px_rgba(16,185,129,0.2)]`}>
                            <video ref={videoRef} className="w-full h-full object-cover" />
                            <canvas ref={scannerCanvasRef} className="hidden" />
                            
                            {scanStatus === 'error' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-center p-6">
                                    <p className="text-red-400 text-3xl mb-2">📷🚫</p>
                                    <p className="text-white font-bold">Caméra introuvable</p>
                                    <p className="text-gray-400 text-sm mt-2">Utilisez l'importation de fichier ci-dessous.</p>
                                </div>
                            ) : (
                                <div className="absolute inset-0 border-[40px] border-black/60 flex items-center justify-center">
                                    <div className="w-48 h-48 border-2 border-white/50 relative">
                                        {isScanning && <div className="absolute top-0 left-0 w-full h-1 bg-green-500/80 shadow-[0_0_10px_#22c55e] animate-scan"></div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-center text-gray-400 text-sm">- OU -</div>

                        {/* Option Fichier */}
                        <div className="bg-white/10 p-6 rounded-xl border border-white/10 text-center">
                            <p className="text-white font-bold mb-2">Importation Manuelle</p>
                            <p className="text-gray-400 text-xs mb-4">Si vous avez reçu le fichier par clé USB ou câble.</p>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span>📂</span> Sélectionner le fichier .json
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileImport} 
                                accept=".json" 
                                className="hidden" 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecureTransferModal;
