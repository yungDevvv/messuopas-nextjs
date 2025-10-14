// src/config/mautic.ts
const MAUTIC_CONFIG = {
    hostname: 'respa.crossmedia.fi',
    templateIds: {
        verification: '24',
        magicURL: '25',
        recovery: '26'
    },
    auth: 'Basic c3VwYWJhc2U6SndzdTk2MjYjMjAyNA=='
};

// src/services/mauticEmail.ts
class MauticEmailService {
    getRequestOptions(method = 'GET') {
        return {
            method,
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'User-Agent': 'EchoapiRuntime/1.1.0',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                'Authorization': MAUTIC_CONFIG.auth
            }
        };
    }

    async checkContactExists(email) {
        try {
            const response = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/contacts?search=${encodeURIComponent(email)}`,
                this.getRequestOptions()
            );

            const data = await response.json();

            if (data && data.contacts) {

                const contactIds = Object.keys(data.contacts);

                if (contactIds.length > 0) {

                    return +contactIds[0];
                }
            }

            return null;
        } catch (error) {
            console.error('Error checking contact:', error);
            throw error;
        }
    }

    async updateContactStatus(email, status) {
        try {
            // Find contact by email, create if not exists
            let contactId = await this.checkContactExists(email);
            // if (!contactId) {
                // Create with given status if not exists
                // contactId = await this.createContact(email, status);
            // } else {
                // Update status field
                const response = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/contacts/${contactId}/edit`, {
                    ...this.getRequestOptions('PATCH'),
                    body: JSON.stringify({
                        status: status
                    })
                });
                if (!response.ok) {
                    throw new Error('Failed to update status in Mautic');
                }
            // }
            return contactId;
        } catch (error) {
            console.error('Error updating contact status:', error);
            throw error;
        }
    }

    async createContact(email, name, status = "waiting") {
        try {
            const [firstName, ...lastNameParts] = (name || '').split(' ');
            const lastName = lastNameParts.join(' ');

            const response = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/contacts/new`, {
                ...this.getRequestOptions('POST'),
                body: JSON.stringify({
                    email,
                    firstname: firstName || '',
                    lastname: lastName || '',
                    status: status,
                    customerid: "Verkostoni",

                    // "fields": {
                    //     "all": {
                    //         "status": "waiting",
                    //         "customerid": "Verkostoni"
                    //     }
                    // }
                })
            });

            const data = await response.json();
            console.log(data, "DAATA123123");
            return data.contact.id;
        } catch (error) {
            console.error('Error creating contact:', error);
            throw error;
        }
    }

    async sendReviewRequestEmail({ reciever_name, reciever_email, sender_name, sender_email, review_link }) {
        try {
            // Tarkista tai luo yhteystieto
            let contactId = await this.checkContactExists(reciever_email);

            if (!contactId) {
                contactId = await this.createContact(reciever_email, reciever_name);
            }

            const emailId = "68";

            const sendResponse = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/emails/${emailId}/contact/${contactId}/send`, {
                ...this.getRequestOptions('POST'),
                body: JSON.stringify({
                    tokens: {
                        reciever_name: reciever_name,
                        sender_email: sender_email,
                        sender_name: sender_name,
                        invite_link: review_link,
                    }
                })
            });

            if (!sendResponse.ok) {
                throw new Error('Sähköpostin lähetys epäonnistui');
            }

            return await sendResponse.json();

        } catch (error) {
            console.error('Sähköpostin lähetys epäonnistui:', error);
            throw error;
        }
    }

    async sendNotification({ reciever_email, messages }) {
        try {
            // Tarkista tai luo yhteystieto
            let contactId = await this.checkContactExists(reciever_email);

            if (!contactId) {
                contactId = await this.createContact(reciever_email, reciever_name);
            }

            const emailId = "67";

            // Lähetä sähköposti kontaktille
            const sendResponse = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/emails/${emailId}/contact/${contactId}/send`, {
                ...this.getRequestOptions('POST'),
                body: JSON.stringify({
                    tokens: {
                        messages: messages
                    }
                })
            });

            if (!sendResponse.ok) {
                throw new Error('Sähköpostin lähetys epäonnistui');
            }

            return await sendResponse.json();

        } catch (error) {
            console.error('Sähköpostin lähetys epäonnistui:', error);
            throw error;
        }
    }

    async sendEmailVerification({ reciever_email, link, reciever_name }) {
        try {
            // Tarkista tai luo yhteystieto
            let contactId = await this.checkContactExists(reciever_email);

            if (!contactId) {
                contactId = await this.createContact(reciever_email, reciever_name);
            }

            const emailId = "69";

            // Lähetä sähköposti kontaktille
            const sendResponse = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/emails/${emailId}/contact/${contactId}/send`, {
                ...this.getRequestOptions('POST'),
                body: JSON.stringify({
                    tokens: {
                        link: link
                    }
                })
            });

            if (!sendResponse.ok) {
                throw new Error('Sähköpostin lähetys epäonnistui');
            }

            return await sendResponse.json();

        } catch (error) {
            console.error('Sähköpostin lähetys epäonnistui:', error);
            throw error;
        }
    }
    async sendEmail({ reciever_email, invite_link, inviter_name }) {
        try {
            // Tarkista tai luo yhteystieto
            let contactId = await this.checkContactExists(reciever_email);

            if (!contactId) {
                contactId = await this.createContact(reciever_email, inviter_name);
            }

            const emailId = "80";

            // Lähetä sähköposti kontaktille
            const sendResponse = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/emails/${emailId}/contact/${contactId}/send`, {
                ...this.getRequestOptions('POST'),
                body: JSON.stringify({
                    tokens: {
                        inviter_name: inviter_name,
                        invite_link: invite_link,
                        app_name: "MyNetwork"
                    }
                })
            });

            if (!sendResponse.ok) {
                throw new Error('Sähköpostin lähetys epäonnistui');
            }

            return await sendResponse.json();

        } catch (error) {
            console.error('Sähköpostin lähetys epäonnistui:', error);
            throw error;
        }
    }

    async sendInvitationEmail({ reciever_email, organization_name, registration_link, name, inviter_email }) {
        try {
            // Check or create contact
            let contactId = await this.checkContactExists(reciever_email);

            if (!contactId) {
                contactId = await this.createContact(reciever_email, '');
            }

            // Use existing email template ID for invitations
            const emailId = "80";

            // Send invitation email with only required tokens
            const sendResponse = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/emails/${emailId}/contact/${contactId}/send`, {
                ...this.getRequestOptions('POST'),
                body: JSON.stringify({
                    tokens: {
                        ownercompany: organization_name,
                        registration_link: registration_link,
                        name: name,
                        inviter_email: inviter_email
                    }
                })
            });

            if (!sendResponse.ok) {
                throw new Error('Kutsuviestin lähetys epäonnistui');
            }

            return await sendResponse.json();

        } catch (error) {
            console.error('Kutsuviestin lähetys epäonnistui:', error);
            throw error;
        }
    }

    async sendNewSectionNotification({ reciever_email, content_link, reciever_name }) {
        try {
            // Check or create contact
            let contactId = await this.checkContactExists(reciever_email);

            if (!contactId) {
                contactId = await this.createContact(reciever_email, reciever_name || '');
            }

            const emailId = "81";

            // Send new section notification email
            const sendResponse = await fetch(`https://${MAUTIC_CONFIG.hostname}/api/emails/${emailId}/contact/${contactId}/send`, {
                ...this.getRequestOptions('POST'),
                body: JSON.stringify({
                    tokens: {
                        content_link: content_link
                    }
                })
            });

            if (!sendResponse.ok) {
                throw new Error('Uuden osion ilmoituksen lähetys epäonnistui');
            }

            return await sendResponse.json();

        } catch (error) {
            console.error('Uuden osion ilmoituksen lähetys epäonnistui:', error);
            throw error;
        }
    }
}

export const mauticEmailService = new MauticEmailService();
