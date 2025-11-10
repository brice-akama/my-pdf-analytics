declare module 'pdf-extraction' {
  const extract: (pdfBuffer: Buffer) => Promise<{ text: string; numrender?: number }>;
  export default extract;
}
