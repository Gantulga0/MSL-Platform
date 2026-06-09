'use client';

import { useState } from 'react';
import { Search, Plus, Trash2, Info } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Pagination,
  Select,
  Skeleton,
  StatusBadge,
  Table,
  Tabs,
  Textarea,
  VideoPlayer,
  colors,
  fontSize,
  radius,
  useToast,
} from '@msl/ui';
import { translate as tBase } from '@/i18n';
import { RoleSwitcher } from '@/components/design-system/RoleSwitcher';

const t = (k: string, params?: Record<string, string | number>) => tBase(k, undefined, params);

// Placeholder media for the player preview (no real child media — C-3).
const POSTER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='320' height='180' fill='%23e2e8f0'/><text x='160' y='95' font-size='16' text-anchor='middle' fill='%23475569'>Sign video</text></svg>";
const VTT =
  'data:text/vtt,WEBVTT%0A%0A00:00.000 --> 00:02.000%0AСайн уу';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="text-2xl font-semibold text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

const INK = colors.fg;
const COLOR_TOKENS: Array<{ name: string; value: string; fg?: string }> = [
  { name: 'bg (cream)', value: colors.bg, fg: INK },
  { name: 'surface', value: colors.surface, fg: INK },
  { name: 'primary (charcoal)', value: colors.primary, fg: '#fff' },
  { name: 'accent (sage)', value: colors.accent, fg: INK },
  { name: 'accent-ink', value: colors.accentInk, fg: '#fff' },
  { name: 'tint-sage', value: colors.tintSage, fg: INK },
  { name: 'tint-lav', value: colors.tintLav, fg: INK },
  { name: 'tint-butter', value: colors.tintButter, fg: INK },
  { name: 'fg (ink)', value: colors.fg, fg: '#fff' },
  { name: 'fg-muted', value: colors.fgMuted, fg: '#fff' },
  { name: 'border', value: colors.border, fg: INK },
  { name: 'success', value: colors.success, fg: '#fff' },
  { name: 'warning', value: colors.warning, fg: '#fff' },
  { name: 'danger', value: colors.danger, fg: '#fff' },
  { name: 'info', value: colors.info, fg: '#fff' },
  { name: 'focus', value: colors.focus, fg: '#fff' },
];

export default function DesignSystemPage(): React.ReactElement {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const tableRows = [
    { id: '1', word: 'Сайн уу', topic: 'Өдөр тутам', status: 'approved' },
    { id: '2', word: 'Ном', topic: 'Сургууль', status: 'pending' },
    { id: '3', word: 'Устөрөгч', topic: 'Хими', status: 'needs_clarification' },
  ];

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-fg">{t('ds.title')}</h1>
        <p className="text-lg text-fg-muted">{t('ds.subtitle')}</p>
        <p className="rounded-md bg-info-subtle p-3 text-base text-info">{t('ds.deafFirstNote')}</p>
      </header>

      <RoleSwitcher />

      <Section id="ds-colors" title={t('ds.colors')}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {COLOR_TOKENS.map((c) => (
            <div key={c.name} className="overflow-hidden rounded-md border border-border">
              <div className="flex h-16 items-center justify-center" style={{ background: c.value, color: c.fg }}>
                <span className="text-sm font-medium">{c.value}</span>
              </div>
              <div className="bg-bg px-2 py-1 text-xs text-fg-muted">{c.name}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="ds-type" title={t('ds.typography')}>
        <div className="space-y-1">
          {(Object.keys(fontSize) as Array<keyof typeof fontSize>).map((size) => (
            <p key={size} style={{ fontSize: fontSize[size][0] }} className="text-fg">
              <span className="mr-3 inline-block w-12 text-xs text-fg-subtle">{size}</span>
              Дохионы хэл — Sign language
            </p>
          ))}
        </div>
      </Section>

      <Section id="ds-radius" title={t('ds.radius')}>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(radius) as Array<keyof typeof radius>).map((r) => (
            <div key={r} className="text-center">
              <div className="h-16 w-16 border-2 border-primary bg-primary-subtle" style={{ borderRadius: radius[r] }} />
              <span className="text-xs text-fg-muted">{r}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="ds-buttons" title={t('ds.buttons')}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">{t('common.save')}</Button>
          <Button variant="secondary">{t('common.cancel')}</Button>
          <Button variant="ghost">{t('common.search')}</Button>
          <Button variant="danger">{t('common.close')}</Button>
          <Button loading>{t('common.submit')}</Button>
          <Button disabled>{t('common.submit')}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">sm</Button>
          <Button size="md">md</Button>
          <Button size="lg">lg</Button>
        </div>
      </Section>

      <Section id="ds-iconbtn" title={t('ds.iconButtons')}>
        <div className="flex gap-3">
          <IconButton label={t('common.search')} icon={<Search className="h-5 w-5" />} variant="secondary" />
          <IconButton label={t('nav.submit')} icon={<Plus className="h-5 w-5" />} variant="primary" />
          <IconButton label={t('common.close')} icon={<Trash2 className="h-5 w-5" />} />
        </div>
      </Section>

      <Section id="ds-badges" title={t('ds.badges')}>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="pending" label="Хүлээгдэж буй" />
          <StatusBadge status="approved" label="Зөвшөөрсөн" />
          <StatusBadge status="rejected" label="Татгалзсан" />
          <StatusBadge status="needs_clarification" label="Тодруулга" />
          <StatusBadge status="duplicate" label="Давхардсан" />
          <Badge tone="primary" icon={<Info className="h-4 w-4" />}>
            {t('ds.variant')}
          </Badge>
        </div>
      </Section>

      <Section id="ds-forms" title={t('ds.forms')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Үг (lemma)" description="Толь бичигт нэмэх үг" required>
            <Input placeholder={t('home.searchPlaceholder')} />
          </Field>
          <Field label={t('ds.select')}>
            <Select
              ariaLabel={t('ds.select')}
              placeholder="Сэдэв сонгох"
              options={[
                { value: 'daily', label: 'Өдөр тутам' },
                { value: 'school', label: 'Сургууль' },
                { value: 'science', label: 'Шинжлэх ухаан' },
              ]}
            />
          </Field>
          <Field label="Тайлбар" error="Энэ талбарыг бөглөнө үү" className="md:col-span-2">
            <Textarea placeholder="..." />
          </Field>
        </div>
      </Section>

      <Section id="ds-tabs" title={t('ds.tabs')}>
        <Tabs
          ariaLabel={t('ds.tabs')}
          items={[
            { value: 'a', label: 'Видео', content: <p className="text-fg">Видео төвтэй танилцуулга.</p> },
            { value: 'b', label: 'Тайлбар', content: <p className="text-fg">Бичвэр тайлбар заавал байна.</p> },
            { value: 'c', label: 'Хувилбар', content: <p className="text-fg">Бүс нутгийн хувилбарууд.</p> },
          ]}
        />
      </Section>

      <Section id="ds-dialog" title={`${t('ds.dialog')} / ${t('ds.toast')}`}>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDialogOpen(true)}>{t('ds.openDialog')}</Button>
          <Button
            variant="secondary"
            onClick={() => toast({ title: t('ds.toastTitle'), description: t('ds.toastBody'), tone: 'success' })}
          >
            {t('ds.showToast')}
          </Button>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={t('ds.dialog')}
          description={t('ds.dialogBody')}
          closeLabel={t('common.close')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={() => setDialogOpen(false)}>{t('common.save')}</Button>
            </>
          }
        >
          <p>{t('ds.dialogBody')}</p>
        </Dialog>
      </Section>

      <Section id="ds-card" title={t('ds.card')}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t('ds.sampleWord')}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-fg-muted">{t('ds.sampleDefinition')}</p>
          </CardBody>
          <CardFooter>
            <StatusBadge status="approved" label="Зөвшөөрсөн" />
          </CardFooter>
        </Card>
        {/* Pastel tone variants — tints always carry dark ink; dark flips to white. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(['white', 'sage', 'lavender', 'butter', 'dark'] as const).map((tone) => (
            <Card key={tone} tone={tone} interactive>
              <CardBody>
                <p className="font-semibold">{tone}</p>
                <p className={tone === 'dark' ? 'text-sm text-fg-on-primary/80' : 'text-sm text-fg-muted'}>
                  {t('ds.sampleWord')}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="ds-video" title={t('ds.video')}>
        <VideoPlayer
          className="max-w-md"
          src="/media/sample-sign.webm"
          poster={POSTER}
          label={`${t('ds.sampleWord')} — sign video`}
          captions={[{ src: VTT, srcLang: 'mn', label: 'Монгол', default: false }]}
          captionsLabels={{ show: t('ds.captionsShow'), hide: t('ds.captionsHide') }}
        />
      </Section>

      <Section id="ds-table" title={t('ds.table')}>
        <Table
          caption={t('ds.table')}
          rows={tableRows}
          rowKey={(r) => r.id}
          columns={[
            { key: 'word', header: 'Үг', render: (r) => r.word },
            { key: 'topic', header: 'Сэдэв', render: (r) => r.topic },
            {
              key: 'status',
              header: 'Төлөв',
              render: (r) => <StatusBadge status={r.status} label={r.status} />,
            },
          ]}
        />
      </Section>

      <Section id="ds-pagination" title={t('ds.pagination')}>
        <Pagination
          page={page}
          totalPages={5}
          onPageChange={setPage}
          labels={{
            nav: t('pagination.nav'),
            previous: t('common.previous'),
            next: t('common.next'),
            page: (p, total) => t('pagination.page', { page: p, total }),
          }}
        />
      </Section>

      <Section id="ds-empty" title={t('ds.emptyState')}>
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title={t('ds.emptyTitle')}
          description={t('ds.emptyBody')}
          action={<Button>{t('common.retry')}</Button>}
        />
      </Section>

      <Section id="ds-skeleton" title={t('ds.skeleton')}>
        <div className="flex items-center gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setLoading((v) => !v)}>
            toggle ({String(loading)})
          </Button>
        </div>
      </Section>
    </main>
  );
}
