import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import useAxiosPrivate from '@/MiddleWares/Hooks/useAxiosPrivate';

const BulkEmailForm = () => {
  const axios = useAxiosPrivate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [scheduleType, setScheduleType] = useState('immediate');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const memberGroups = [
    { id: 'all', name: 'All Members' },
    { id: 'defaulters', name: 'Loan Defaulters' },
    { id: 'savers', name: 'Active Savers' },
    { id: 'inactive', name: 'Inactive Members' },
  ];

  const emailTemplates = [
    { 
      id: 'payment-reminder', 
      name: 'Payment Reminder', 
      subject: 'Payment Due Reminder',
      template: `<p>Dear {name},</p>
<p>This is a reminder that your payment of {amount} is due on {date}.</p>
<p>Kindly make the payment before the due date to avoid penalties.</p>
<p>Best regards,<br/>SACCO Team</p>`
    },
    { 
      id: 'meeting-notice', 
      name: 'Meeting Notice', 
      subject: 'Upcoming SACCO Meeting',
      template: `<p>Dear {name},</p>
<p>We would like to inform you about our upcoming SACCO meeting:</p>
<p><strong>Date:</strong> {date}<br/>
<strong>Time:</strong> {time}<br/>
<strong>Venue:</strong> {venue}</p>
<p>Your attendance is highly appreciated.</p>
<p>Best regards,<br/>SACCO Team</p>`
    },
    { 
      id: 'dividend-notice', 
      name: 'Dividend Notice', 
      subject: 'Dividend Credited to Your Account',
      template: `<p>Dear {name},</p>
<p>We are pleased to inform you that your dividend of {amount} has been credited to your account.</p>
<p>Current balance: {balance}</p>
<p>Thank you for being a valued member.</p>
<p>Best regards,<br/>SACCO Team</p>`
    },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        setFileName(file.name);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      if (recipientType === 'custom') {
        if (!csvFile) throw new Error('Please upload a CSV file for custom recipients');
        const text = await csvFile.text();
        const emails = text.split('\n').slice(1).map(l => l.split(',')[0].trim()).filter(Boolean);
        if (!emails.length) throw new Error('No valid email addresses found in CSV');
        await axios.post('emails/selected-clients', { emails, subject, message });
      } else {
        await axios.post('emails/branch-clients', { subject, message });
      }
      toast({ title: 'Email Queued', description: 'Bulk email has been queued for delivery.' });
      setSubject(''); setMessage(''); setRecipientType('all'); setSelectedGroups([]); setCsvFile(null); setFileName('');
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.messages?.[0] ?? error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = (templateId) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.template);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `email,name,account_number
member1@example.com,John Doe,ACC001
member2@example.com,Jane Smith,ACC002
member3@example.com,Robert Johnson,ACC003
member4@example.com,Sarah Williams,ACC004
member5@example.com,Michael Brown,ACC005`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_email_contacts.csv';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Recipients</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recipient type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="groups">Specific Groups</SelectItem>
                <SelectItem value="custom">Custom List (Upload CSV)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {recipientType === 'groups' && (
            <div className="space-y-2">
              <Label>Select Groups</Label>
              {memberGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={(checked) => {
                      setSelectedGroups(
                        checked
                          ? [...selectedGroups, group.id]
                          : selectedGroups.filter((id) => id !== group.id)
                      );
                    }}
                  />
                  <Label htmlFor={group.id}>{group.name}</Label>
                </div>
              ))}
            </div>
          )}

          {recipientType === 'custom' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Upload CSV File</Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary hover:text-primary/80"
                  onClick={downloadSampleCSV}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Sample CSV
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent border-muted-foreground/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV file with email addresses (max. 10MB)
                    </p>
                  </div>
                  <Input
                    id="csv-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>
              {fileName && (
                <div className="flex items-center mt-2 text-sm text-foreground">
                  <span className="font-medium">{fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-destructive hover:text-destructive/80"
                    onClick={() => {
                      setCsvFile(null);
                      setFileName('');
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p>CSV format: Email addresses in the first column (e.g., &ldquo;member@example.com&ldquo;)</p>
                <p>Optional columns: name, account_number (for message personalization)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject"
        />
      </div>

      <div className="space-y-2">
        <Label>Email Content</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your email content here..."
              rows={10}
            />
            <div className="text-sm text-muted-foreground">
              HTML content is supported
            </div>
          </div>
          <div className="space-y-2">
            <Label>Templates</Label>
            <Select onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              Available variables: {'{name}, {amount}, {date}, {time}, {balance}, {account_number}'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Schedule</Label>
        <RadioGroup defaultValue="immediate" className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="immediate"
              id="immediate"
              checked={scheduleType === 'immediate'}
              onClick={() => setScheduleType('immediate')}
            />
            <Label htmlFor="immediate">Send Immediately</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="scheduled"
              id="scheduled"
              checked={scheduleType === 'scheduled'}
              onClick={() => setScheduleType('scheduled')}
            />
            <Label htmlFor="scheduled">Schedule for Later</Label>
          </div>
          {scheduleType === 'scheduled' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </RadioGroup>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSendEmail} 
          disabled={isLoading || !subject || !message || (recipientType === 'custom' && !csvFile)}
        >
          {isLoading ? 'Sending...' : 'Send Bulk Email'}
        </Button>
      </div>
    </div>
  );
};

export default BulkEmailForm;