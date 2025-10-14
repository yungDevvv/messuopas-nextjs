"use server";

import { getLoggedInUser, getFilteredInitialSections } from '@/lib/appwrite/server';
import { redirect } from 'next/navigation';

// Helper to create URL-friendly slugs from titles
function slugify(text) {
    if (!text) return '';
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
}

export default async function SectionPage({ params }) {
    const user = await getLoggedInUser();
    
    if (!user) return redirect("/login");

    const { sectionPath } = await params;
    const {data: sectionsResponse} = await getFilteredInitialSections(user);

    // Find the current section
    const currentSection = sectionsResponse.find(section => {
        const titlePart = section.title.split('. ')[1] || '';
        return slugify(titlePart) === sectionPath;
    });

    // Find the first active subsection to redirect to
    const firstActiveSubsection = currentSection?.initialSubsections?.find(sub => sub.isActive);

    if (firstActiveSubsection && firstActiveSubsection.path) {
        redirect(firstActiveSubsection.path);
    } else {
        // If no active subsection, redirect to homepage or show a message
        redirect('/');
    }
};