import os
from google import genai
from dotenv import load_dotenv

# Load variables from a .env file (if you have one)
load_dotenv()

# 1. Initialize API Key Securely
# It will look for the key in your environment variables or .env file
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

def uji_analisis_teks(teks_curhat):
    """Function to test text analysis"""
    print("=" * 50)
    print("1. MENGUJI ANALISIS TEKS CURHATAN...")
    print(f"Input Pengguna: '{teks_curhat}'\n")
    
    prompt = f"""
    Bertindaklah sebagai psikolog profesional yang empatik.
    Analisis teks curhatan pengguna berikut:
    "{teks_curhat}"
    
    Berikan respons terstruktur:
    1. Tingkat Emosi/Kecemasan (Rendah / Sedang / Tinggi)
    2. Identifikasi Akar Masalah
    3. Draf Langkah Penanganan Awal yang Empatik
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        print("--- HASIL RESPONS GEMINI AI ---")
        print(response.text)
    except Exception as e:
        print(f"[!] Error saat menghubungi server Gemini (Teks): {e}")
        
    print("=" * 50 + "\n")

def uji_analisis_audio(nama_file_audio):
    """Fungsi untuk menguji analisis file audio dengan filter lagu"""
    print("=" * 50)
    print("2. MENGUJI ANALISIS AUDIO CURHATAN (MULTIMODAL)...")
    
    if not os.path.exists(nama_file_audio):
        print(f"[!] File '{nama_file_audio}' tidak ditemukan di folder.")
        print("    Pastikan file diletakkan di D:\\projek\\ dan bernama persis 'curhat.mp3'")
        print("=" * 50 + "\n")
        return

    try:
        print(f"Mengunggah file audio: {nama_file_audio}...")
        audio_file = client.files.upload(file=nama_file_audio)
        
        # PROMPT SMART FILTER: Membedakan suara manusia dan lagu
        prompt = """
        Bertindaklah sebagai psikolog profesional yang empatik. Dengarkan audio yang diunggah dengan saksama.
        
        LANGKAH 1: VALIDASI AUDIO
        Pertama, deteksi apakah audio ini adalah suara asli manusia yang sedang berbicara/curhat, atau sebuah lagu/musik.
        - Jika terdeteksi sebagai lagu, instrumen musik, atau bernyanyi, HENTIKAN analisis sekarang juga. Berikan HANYA balasan ini: "Mohon maaf, sistem mendeteksi ini adalah lagu atau musik. Silakan unggah rekaman suara curhatan Anda yang asli."
        - Jika terdeteksi sebagai suara manusia asli yang sedang berbicara, lanjutkan ke LANGKAH 2.
        
        LANGKAH 2: ANALISIS PSIKOLOGIS
        Analisis fitur akustik emosinya (intonasi, nada, nada bicara tertekan/cemas/tenang).
        Berikan respons terstruktur:
        1. Transkripsi singkat apa yang diucapkan
        2. Deteksi Kondisi Emosi dari Nada Suara
        3. Akar Masalah Utama
        4. Draf Solusi Awal untuk Konselor
        """
        
        print("Menganalisis gelombang suara dan memvalidasi isi audio...")
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=[audio_file, prompt]
        )
        
        print("\n--- HASIL RESPONS GEMINI AI (AUDIO) ---")
        print(response.text)
        
    except Exception as e:
        print(f"[!] Error saat memproses file audio: {e}")
        
    print("=" * 50 + "\n")
    
# ==========================================
# MENJALANKAN UJI COBA
# ==========================================
if __name__ == "__main__":
    contoh_curhat_teks = "Akhir-akhir ini saya sering terbangun malam hari, dada rasanya sesak dan cemas memikirkan revisi skripsi yang tidak kunjung selesai. Saya merasa tertinggal dari teman-teman."
    uji_analisis_teks(contoh_curhat_teks)
    
    uji_analisis_audio("curhat.mp3")