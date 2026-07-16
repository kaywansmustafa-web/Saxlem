import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GetLiveQueue } from "@/features/live-queue/application/operate-queue";
import { MockLiveQueueRepository } from "@/features/live-queue/data/mock-live-queue-repository";
import { LiveQueueWorkspace } from "@/features/live-queue/presentation/live-queue-workspace";
import { queueMessages } from "@/features/live-queue/presentation/messages";
afterEach(cleanup);
describe("live queue workspace",()=>{it("renders localized RTL-safe landmarks and keyboard controls",async()=>{const data=await new GetLiveQueue(new MockLiveQueueRepository()).execute("queue-karwan");if(!data)throw Error("missing seed");render(<div dir="rtl"><LiveQueueWorkspace initial={data} locale="ar" m={queueMessages("ar")}/></div>);expect(screen.getByRole("heading",{name:"المريض الحالي"})).toBeInTheDocument();const button=screen.getByRole("button",{name:"استدعاء التالي"});button.focus();expect(button).toHaveFocus()});it("requires confirmation before completion",async()=>{const data=await new GetLiveQueue(new MockLiveQueueRepository()).execute("queue-karwan");if(!data)throw Error("missing seed");const confirm=vi.spyOn(window,"confirm").mockReturnValue(false),fetch=vi.spyOn(globalThis,"fetch");render(<LiveQueueWorkspace initial={data} locale="en" m={queueMessages("en")}/>);await userEvent.click(screen.getByRole("button",{name:"Complete Consultation"}));expect(confirm).toHaveBeenCalledOnce();expect(fetch).not.toHaveBeenCalled();confirm.mockRestore();fetch.mockRestore()})});
