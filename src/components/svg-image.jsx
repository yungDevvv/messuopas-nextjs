"use client"
import { useEffect, useState } from 'react';

/**
 * Universal Image/SVG Component for Appwrite Storage
 * 
 * Automatically detects file type and renders appropriately:
 * - SVG files: inlined for styling and performance
 * - Other images: standard <img> tag
 * 
 * Props:
 * - bucketId, fileId: Appwrite storage identifiers (recommended)
 * - url: direct URL (alternative to bucketId/fileId)
 * - className: CSS classes
 * - alt: alt text for accessibility
 * - useSSR: use SSR API route instead of direct Appwrite URL (default: true)
 */
const SVGComponent = ({ bucketId, fileId, url, className, alt = "image", useSSR = true }) => {
    const [svgContent, setSvgContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Build URL from bucketId/fileId or use provided URL
    const fileUrl = url || (bucketId && fileId ? 
        (useSSR ? `/api/file/${bucketId}/${fileId}` : 
         `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`) 
        : null);
    
    useEffect(() => {
        const loadImage = async () => {
            if (!fileUrl) {
                setError('No file URL provided');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                
                const response = await fetch(fileUrl);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status} - ${errorText}`);
                }
                
                const contentType = response.headers.get('content-type');
                
                // If Content-Type indicates it's not SVG, treat as regular image
                if (contentType && !contentType.includes('svg') && !contentType.includes('xml')) {
                    setSvgContent(null);
                    return;
                }
                
                const text = await response.text();
                
                // Check for SVG content (like your original logic)
                if (text.includes('<?xml') && text.includes('<svg')) {
                    // Parse and modify SVG size
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'image/svg+xml');
                    const svgElement = doc.querySelector('svg');
                    
                    if (svgElement) {
                        svgElement.style.width = '100%';
                        svgElement.style.height = '100%';
                        if (className) {
                            svgElement.setAttribute('class', className);
                        }
                        setSvgContent(svgElement.outerHTML);
                    } else {
                        setSvgContent(text);
                    }
                } else if (text.includes('<svg')) {
                    // Handle SVG without XML declaration
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'image/svg+xml');
                    const svgElement = doc.querySelector('svg');
                    
                    if (svgElement) {
                        svgElement.style.width = '100%';
                        svgElement.style.height = '100%';
                        if (className) {
                            svgElement.setAttribute('class', className);
                        }
                        setSvgContent(svgElement.outerHTML);
                    } else {
                        setSvgContent(text);
                    }
                } else {
                    // Not SVG content
                    setSvgContent(null);
                }
            } catch (error) {
                console.log('Error loading image:', error);
                setError(error.message);
                setSvgContent(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (fileUrl) {
            loadImage();
        }
    }, [fileUrl, className]);

    if (isLoading) {
        return <div className={className}>Loading...</div>;
    }

    if (error) {
        return <div className={className}>Error: {error}</div>;
    }

    if (!svgContent) {
        return (
            <img
                src={fileUrl}
                alt={alt}
                className={className}
                loading="lazy"
            />
        );
    }

    return (
        <div 
            className={className}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
};

export default SVGComponent;