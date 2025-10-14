"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Building2, Layers, Info, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { confirmSection } from "./actions";

export default function NewSectionClient({ section, subsections, organization, organizationId, sectionId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [decision, setDecision] = useState(null); // 'accepted' or 'declined'
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  // Debug: log section data
  console.log('Section data:', section);
  console.log('Subsections:', subsections);

  // Check if organization already has access
  const alreadyHasAccess = section.appliedOrganizations?.some(
    (org) => org.$id === organization.$id || org === organization.$id
  );

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await confirmSection(section.$id, organization.$id);

      if (!result.success) {
        throw new Error(result.error || "Failed to confirm section");
      }

      // Update token status to 'accepted'
      await fetch('/api/update-section-token-by-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          sectionId,
          status: 'accepted',
        }),
      });

      setDecision("accepted");
      toast.success("Osio otettu käyttöön onnistuneesti!");

      // Redirect to main page after 2 seconds
      setTimeout(() => {
        router.push("/messuopas");
      }, 2000);
    } catch (error) {
      console.error("Failed to confirm section:", error);
      toast.error("Käyttöönotto epäonnistui");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      // Update token status to 'declined'
      await fetch('/api/update-section-token-by-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          sectionId,
          status: 'declined',
        }),
      });

      setDecision("declined");
      toast.info("Osio hylätty");

      // Redirect to main page after 2 seconds
      setTimeout(() => {
        router.push("/messuopas");
      }, 2000);
    } catch (error) {
      console.error("Failed to decline section:", error);
      toast.error("Hylääminen epäonnistui");
    } finally {
      setIsLoading(false);
    }
  };

  if (decision === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <Card className="max-w-md w-full mx-4 border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-400">Osio otettu käyttöön!</CardTitle>
            <CardDescription>
              Osio "{section.title}" on nyt käytössä organisaatiossasi
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Ohjataan takaisin...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (decision === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
        <Card className="max-w-md w-full mx-4 border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-gray-600 dark:text-gray-400" />
            </div>
            <CardTitle className="text-2xl text-gray-700 dark:text-gray-400">Osio hylätty</CardTitle>
            <CardDescription>
              Osio "{section.title}" ei ole käytössä organisaatiossasi
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Ohjataan takaisin...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyHasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <Card className="max-w-md w-full mx-4 border-blue-200 dark:border-blue-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Info className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">Osio jo käytössä</CardTitle>
            <CardDescription>
              Osio "{section.title}" on jo käytössä organisaatiossasi
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/messuopas")} variant="outline">
              Palaa takaisin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Uusi osio saatavilla</CardTitle>
                <CardDescription>Haluatko ottaa tämän osion käyttöön organisaatiossasi?</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 justify-between">
              <p className="text-base font-medium">Organisaatio</p>
              <p className="text-xl font-semibold text-green-700 dark:text-green-300">{organization.name}</p>
            </div>

            <Separator />

            {/* Section Title */}
            <div>
              <h2 className="text-2xl font-bold mb-1">{section.title}</h2>
              {section.aliosiot && (
                <p className="text-muted-foreground">{section.aliosiot}</p>
              )}
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <Info className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-900 dark:text-green-100">
                <p className="font-medium mb-1">Huomio</p>
                <p className="text-green-700 dark:text-green-300">
                  Hyväksymällä tämän osion, se tulee näkyviin organisaatiosi käyttäjille ja he voivat alkaa käyttää sitä.
                  Voit myöhemmin poistaa osion käytöstä tarvittaessa.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleDecline}
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                disabled={isLoading}
              >

                Hylkää
              </Button>
              <Button
                onClick={handleConfirm}
                size="lg"
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Käsitellään...
                  </>
                ) : (
                  <>

                    Hyväksy ja ota käyttöön
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subsections Preview */}
        {subsections.length > 0 && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Aliosiot ({subsections.length})
              </CardTitle>
              <CardDescription>
                Tarkastele osion sisältämiä aliosioita
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tabs for subsections */}
              <div className="space-y-4">
                {/* Tab buttons */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {subsections.map((subsection, index) => (
                    <button
                      key={subsection.$id || index}
                      onClick={() => setActiveTab(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === index
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-2 border-green-300 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-transparent'
                        }`}
                    >
                      {subsection.title || `Aliosio ${index + 1}`}
                    </button>
                  ))}
                </div>

                {/* Tab content - Preview */}
                <div className="border rounded-lg bg-white dark:bg-gray-950/50 overflow-hidden">
                  {subsections[activeTab] && (
                    <div className="space-y-4">
                      {/* Title header */}
                      <div className="p-6 pb-4 border-b bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-xl font-semibold mb-2">
                          {subsections[activeTab].title}
                        </h3>
                        {subsections[activeTab].description && (
                          <p className="text-muted-foreground text-sm">
                            {subsections[activeTab].description}
                          </p>
                        )}
                      </div>

                      {/* HTML Content Preview */}
                      <div className="p-6 pt-4">
                        {subsections[activeTab].html ? (
                          <div
                            className="text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:p-2 [&_th]:bg-gray-100 [&_td]:border [&_td]:p-2"
                            dangerouslySetInnerHTML={{
                              __html: (subsections[activeTab].html || '').replace(/className=/g, 'class=')
                            }}
                          />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Ei sisältöä saatavilla</p>
                          </div>
                        )}
                      </div>

                      {/* Preview note */}
                      <div className="mx-6 mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <Info className="w-4 h-4 inline mr-1" />
                          Tämä on esikatselu. Hyväksymällä osion, kaikki aliosiot tulevat käyttöön.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
